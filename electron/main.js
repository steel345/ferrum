'use strict'

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn, execSync } = require('child_process')

// ── Auto-updater (graceful fallback if not available) ─────────────────────────
let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
} catch (_) {}

// ── Force consistent app name so userData path is the same in dev + prod ──────
app.setName('Ferrum')

// ── Dev detection ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ── Running MC process tracker ────────────────────────────────────────────────
let mcProcess = null

// ── Main window ───────────────────────────────────────────────────────────────
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#030609',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // ── Intercept close to auto-save first ────────────────────────────────────
  mainWindow._allowClose = false

  mainWindow.on('close', (e) => {
    if (mainWindow._allowClose) return
    e.preventDefault()
    mainWindow.webContents.send('app-before-close')
    // Fallback: force-close after 3s if renderer doesn't respond
    mainWindow._closeTimer = setTimeout(() => {
      mainWindow._allowClose = true
      mainWindow.close()
    }, 3000)
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()

  // Setup auto-updater
  if (autoUpdater && !isDev) {
    autoUpdater.on('update-available', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-available', info)
    })
    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-downloaded', info)
    })
    try { autoUpdater.checkForUpdatesAndNotify() } catch (_) {}
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Window controls ───────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize() })
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close() })

// ── close-ready: renderer finished saving, now actually close ─────────────────
ipcMain.handle('close-ready', () => {
  // Find the close vars via mainWindow closure — just set a global flag
  if (mainWindow) {
    mainWindow._allowClose = true
    if (mainWindow._closeTimer) { clearTimeout(mainWindow._closeTimer); mainWindow._closeTimer = null }
    mainWindow.close()
  }
})

// ── open-in-explorer ──────────────────────────────────────────────────────────
ipcMain.handle('open-in-explorer', async (event, { filePath, content }) => {
  try {
    const tempDir = path.join(os.tmpdir(), 'ferrum_explorer')
    const fullPath = path.join(tempDir, filePath.replace(/\//g, path.sep))
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8')
    shell.showItemInFolder(fullPath)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── detect-minecraft ──────────────────────────────────────────────────────────
ipcMain.handle('detect-minecraft', async () => {
  const candidates = []

  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    candidates.push(path.join(appdata, '.minecraft'))
  } else if (process.platform === 'darwin') {
    candidates.push(path.join(os.homedir(), 'Library', 'Application Support', 'minecraft'))
  } else {
    candidates.push(path.join(os.homedir(), '.minecraft'))
  }

  let found = false
  let mcDir = ''
  let versions = []
  let javaPath = ''

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      found = true
      mcDir = candidate

      // List installed versions
      const versionsDir = path.join(candidate, 'versions')
      if (fs.existsSync(versionsDir)) {
        try {
          versions = fs.readdirSync(versionsDir)
            .filter(v => {
              const jsonPath = path.join(versionsDir, v, `${v}.json`)
              return fs.existsSync(jsonPath)
            })
            .sort()
            .reverse()
        } catch (_) {}
      }

      // Detect bundled Java inside MC runtime folder
      const runtimeDir = path.join(candidate, 'runtime')
      if (fs.existsSync(runtimeDir)) {
        javaPath = findJavaInRuntime(runtimeDir)
      }

      // Fallback: system java
      if (!javaPath) {
        javaPath = findSystemJava()
      }

      break
    }
  }

  return { found, mcDir, versions, javaPath }
})

function findJavaInRuntime(runtimeDir) {
  try {
    const subdirs = fs.readdirSync(runtimeDir)
    for (const sub of subdirs) {
      // e.g. java-runtime-alpha, java-runtime-beta, java-runtime-gamma, java-runtime-delta
      if (!sub.startsWith('java-runtime') && !sub.startsWith('jre')) continue
      const subPath = path.join(runtimeDir, sub)
      if (!fs.statSync(subPath).isDirectory()) continue

      // Level 1: platform folders like windows-x64
      const level1 = fs.readdirSync(subPath)
      for (const l1 of level1) {
        const l1Path = path.join(subPath, l1)
        if (!fs.statSync(l1Path).isDirectory()) continue

        // Level 2: look for bin/java.exe
        const binPath = path.join(l1Path, sub, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
        if (fs.existsSync(binPath)) return binPath

        // Alternative: direct bin under l1
        const directBin = path.join(l1Path, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
        if (fs.existsSync(directBin)) return directBin
      }
    }
  } catch (_) {}
  return ''
}

function findSystemJava() {
  try {
    const cmd = process.platform === 'win32' ? 'where java' : 'which java'
    const result = execSync(cmd, { encoding: 'utf8', timeout: 3000 }).trim()
    if (result) return result.split('\n')[0].trim()
  } catch (_) {}
  return 'java'
}

// ── launch-minecraft ──────────────────────────────────────────────────────────
ipcMain.handle('launch-minecraft', async (event, { mcDir, version, datapackFiles, projectNamespace, projectDatapackRoot }) => {
  if (mcProcess) {
    try { mcProcess.kill() } catch (_) {}
    mcProcess = null
  }

  const send = (line) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mc-log', line)
    }
  }

  try {
    // 1. Find Java
    let javaExe = ''
    const runtimeDir = path.join(mcDir, 'runtime')
    if (fs.existsSync(runtimeDir)) {
      javaExe = findJavaInRuntime(runtimeDir)
    }
    if (!javaExe) javaExe = findSystemJava()
    if (!javaExe) javaExe = 'java'

    send(`[Ferrum] Using Java: ${javaExe}`)

    // 2. Read version JSON
    const versionJsonPath = path.join(mcDir, 'versions', version, `${version}.json`)
    if (!fs.existsSync(versionJsonPath)) {
      throw new Error(`Version JSON not found: ${versionJsonPath}`)
    }
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'))

    send(`[Ferrum] Loaded version manifest for ${version}`)

    // 3. Build classpath
    const librariesDir = path.join(mcDir, 'libraries')
    const classpathEntries = []

    if (versionData.libraries) {
      for (const lib of versionData.libraries) {
        // Check rules
        if (lib.rules) {
          let allowed = false
          for (const rule of lib.rules) {
            if (rule.action === 'allow') {
              if (!rule.os) { allowed = true; continue }
              const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux'
              if (rule.os.name === osName) { allowed = true; continue }
            } else if (rule.action === 'disallow') {
              if (!rule.os) { allowed = false; continue }
              const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux'
              if (rule.os.name === osName) { allowed = false; continue }
            }
          }
          if (!allowed) continue
        }

        // Resolve path from downloads.artifact
        if (lib.downloads && lib.downloads.artifact) {
          const libPath = path.join(librariesDir, lib.downloads.artifact.path)
          if (fs.existsSync(libPath)) classpathEntries.push(libPath)
        } else if (lib.name) {
          // Fallback: parse maven coordinates
          const parts = lib.name.split(':')
          if (parts.length >= 3) {
            const [group, artifact, libVersion] = parts
            const groupPath = group.replace(/\./g, '/')
            const jarName = `${artifact}-${libVersion}.jar`
            const libPath = path.join(librariesDir, groupPath, artifact, libVersion, jarName)
            if (fs.existsSync(libPath)) classpathEntries.push(libPath)
          }
        }
      }
    }

    // Add version jar
    const versionJar = path.join(mcDir, 'versions', version, `${version}.jar`)
    if (fs.existsSync(versionJar)) classpathEntries.push(versionJar)

    const separator = process.platform === 'win32' ? ';' : ':'
    const classpath = classpathEntries.join(separator)

    // 4. Per-project isolated game directory — each project gets its own MC instance
    const namespace = projectNamespace || 'ferrum_pack'
    const safeName = namespace.replace(/[^a-zA-Z0-9_]/g, '_')
    const gameDir = path.join(app.getPath('userData'), 'ferrum_projects', safeName, version)
    fs.mkdirSync(gameDir, { recursive: true })

    // 5. Dedicated world for this project — named after the project
    const worldName = `Ferrum_${safeName}`
    const savesDir = path.join(gameDir, 'saves')
    const worldDir = path.join(savesDir, worldName)
    fs.mkdirSync(worldDir, { recursive: true })

    // If world has no level.dat yet, copy one from the user's .minecraft/saves
    // so MC can auto-load it directly. Falls back to prompting the user.
    const levelDatDest = path.join(worldDir, 'level.dat')
    let worldReady = fs.existsSync(levelDatDest)
    if (!worldReady) {
      const mcSavesDir = path.join(mcDir, 'saves')
      if (fs.existsSync(mcSavesDir)) {
        const userWorlds = fs.readdirSync(mcSavesDir)
          .filter(w => {
            try { return fs.existsSync(path.join(mcSavesDir, w, 'level.dat')) } catch { return false }
          })
        if (userWorlds.length > 0) {
          // Use most recently played world as template
          let newest = 0, srcWorld = userWorlds[0]
          for (const w of userWorlds) {
            const t = fs.statSync(path.join(mcSavesDir, w, 'level.dat')).mtimeMs
            if (t > newest) { newest = t; srcWorld = w }
          }
          try {
            fs.copyFileSync(path.join(mcSavesDir, srcWorld, 'level.dat'), levelDatDest)
            const iconSrc = path.join(mcSavesDir, srcWorld, 'icon.png')
            if (fs.existsSync(iconSrc)) fs.copyFileSync(iconSrc, path.join(worldDir, 'icon.png'))
            worldReady = true
            send(`[Ferrum] Created isolated world "${worldName}" for project "${safeName}"`)
          } catch (_) {}
        }
      }
      if (!worldReady) {
        send(`[Ferrum] ⚠  No existing world found to use as template.`)
        send(`[Ferrum] ⚠  Launch MC, create any world, then click Play in Ferrum again.`)
      }
    }

    // Write datapacks ONLY to this project's dedicated world
    function writeDatapackToWorld() {
      const dpDir = path.join(worldDir, 'datapacks', safeName)
      fs.mkdirSync(dpDir, { recursive: true })
      if (!datapackFiles || typeof datapackFiles !== 'object') return
      const dpRoot = projectDatapackRoot || ''
      for (const [filePath, content] of Object.entries(datapackFiles)) {
        if (typeof content === 'string' && content.startsWith('data:')) continue
        if (filePath.includes('_resourcepack')) continue
        let rel = filePath
        if (dpRoot && filePath.startsWith(dpRoot + '/')) rel = filePath.slice(dpRoot.length + 1)
        else if (dpRoot && filePath.startsWith(dpRoot)) rel = filePath.slice(dpRoot.length).replace(/^[\\/]/, '')
        if (!rel || rel.endsWith('.gitkeep')) continue
        const fullPath = path.join(dpDir, rel)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8')
      }
    }

    writeDatapackToWorld()
    send(`[Ferrum] Datapack written → saves/${worldName}/datapacks/${safeName}/`)
    const targetWorld = worldName

    // 6. Build launch arguments
    const mainClass = versionData.mainClass || 'net.minecraft.client.main.Main'
    const nativesDir = path.join(mcDir, 'versions', version, `${version}-natives`)
    const assetsDir = path.join(mcDir, 'assets')
    const assetIndex = versionData.assetIndex ? versionData.assetIndex.id : version

    // JVM args
    const jvmArgs = [
      `-Djava.library.path=${nativesDir}`,
      `-Dminecraft.launcher.brand=ferrum`,
      `-Dminecraft.launcher.version=1.0`,
      `-cp`, classpath,
    ]

    // Game args
    let gameArgs = []
    if (versionData.arguments && versionData.arguments.game) {
      // 1.13+ format
      for (const arg of versionData.arguments.game) {
        if (typeof arg === 'string') {
          gameArgs.push(arg)
        }
        // skip conditional args objects for simplicity
      }
    } else if (versionData.minecraftArguments) {
      // Old format — split by spaces
      gameArgs = versionData.minecraftArguments.split(' ')
    }

    // Replace argument variables
    const argVars = {
      '${auth_player_name}': 'FerrumDev',
      '${version_name}': version,
      '${game_directory}': gameDir,
      '${assets_root}': assetsDir,
      '${assets_index_name}': assetIndex,
      '${auth_uuid}': '00000000-0000-0000-0000-000000000000',
      '${auth_access_token}': 'offline',
      '${user_type}': 'offline',
      '${version_type}': versionData.type || 'release',
      '${resolution_width}': '1280',
      '${resolution_height}': '720',
      '${user_properties}': '{}',
      '${game_assets}': assetsDir,
      '${auth_session}': 'offline',
    }

    gameArgs = gameArgs.map(arg => {
      let resolved = arg
      for (const [key, val] of Object.entries(argVars)) {
        resolved = resolved.replace(key, val)
      }
      return resolved
    })

    // Auto-load into the target world (1.20+ supports --quickPlaySingleplayer)
    gameArgs.push('--quickPlaySingleplayer', targetWorld)

    const fullArgs = [...jvmArgs, mainClass, ...gameArgs]

    send(`[Ferrum] Launching: ${javaExe} ${fullArgs.slice(0, 4).join(' ')} ...`)
    send(`[Ferrum] Game directory: ${gameDir}`)
    send(`[Ferrum] Main class: ${mainClass}`)

    // 7. Spawn Java
    mcProcess = spawn(javaExe, fullArgs, {
      cwd: gameDir,
      env: { ...process.env },
    })

    mcProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n')
      lines.forEach(line => { if (line.trim()) send(line) })
    })

    mcProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n')
      lines.forEach(line => { if (line.trim()) send(line) })
    })

    mcProcess.on('close', (code) => {
      send(`[Ferrum] Minecraft process exited with code ${code}`)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mc-stopped', { code })
      }
      mcProcess = null
    })

    mcProcess.on('error', (err) => {
      send(`[Ferrum] Error: ${err.message}`)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mc-stopped', { code: -1, error: err.message })
      }
      mcProcess = null
    })

    return { success: true, pid: mcProcess.pid }
  } catch (err) {
    send(`[Ferrum] Launch failed: ${err.message}`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mc-stopped', { code: -1, error: err.message })
    }
    return { success: false, error: err.message }
  }
})

// ── projects persistence (file-based, more reliable than localStorage) ───────
ipcMain.handle('save-projects', async (event, projectsJson) => {
  try {
    const savePath = path.join(app.getPath('userData'), 'ferrum_projects.json')
    fs.writeFileSync(savePath, projectsJson, 'utf8')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('load-projects', async () => {
  try {
    const savePath = path.join(app.getPath('userData'), 'ferrum_projects.json')
    if (!fs.existsSync(savePath)) return { ok: true, data: '[]' }
    const data = fs.readFileSync(savePath, 'utf8')
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

// ── free-ai-request (bypasses browser CORS via Node.js fetch) ────────────────
ipcMain.handle('free-ai-request', async (event, { systemPrompt, userMessage }) => {
  try {
    const https = require('https')
    const body = JSON.stringify({
      model: 'qwen-coder',  // Qwen2.5-Coder-32B
      messages: [
        { role: 'system', content: (systemPrompt || '').slice(0, 2000) },
        { role: 'user',   content: (userMessage  || '').slice(0, 4000) },
      ],
    })

    return await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'text.pollinations.ai',
        path: '/openai',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 60000,
      }, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({ ok: false, status: res.statusCode, body: data.slice(0, 200) })
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json?.choices?.[0]?.message?.content || ''
            resolve({ ok: true, text })
          } catch {
            resolve({ ok: true, text: data })
          }
        })
      })
      req.on('error', (err) => reject(err))
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
      req.write(body)
      req.end()
    })
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

// ── stop-minecraft ────────────────────────────────────────────────────────────
ipcMain.handle('stop-minecraft', async () => {
  if (mcProcess) {
    try {
      mcProcess.kill('SIGTERM')
      setTimeout(() => {
        if (mcProcess) { try { mcProcess.kill('SIGKILL') } catch (_) {} }
      }, 3000)
    } catch (err) {
      return { success: false, error: err.message }
    }
    mcProcess = null
    return { success: true }
  }
  return { success: false, error: 'No MC process running' }
})

// ── open-folder-dialog ────────────────────────────────────────────────────────
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Datapack Project Folder',
  })
  if (result.canceled || !result.filePaths.length) return { canceled: true }
  return { canceled: false, path: result.filePaths[0] }
})

// ── read-file ─────────────────────────────────────────────────────────────────
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return { success: true, content }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ── write-file ────────────────────────────────────────────────────────────────
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ── read-dir ──────────────────────────────────────────────────────────────────
ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const result = readDirRecursive(dirPath)
    return { success: true, tree: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

function readDirRecursive(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const result = {}
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      result[entry.name] = readDirRecursive(fullPath)
    } else {
      result[entry.name] = fullPath
    }
  }
  return result
}
