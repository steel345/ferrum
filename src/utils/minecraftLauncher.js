import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// ── Fetch the official Mojang server JAR url for a given version ─────────────
export async function getServerDownloadUrl(targetVersion) {
  // Fetch version manifest from Mojang
  const manifest = await fetch(
    'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'
  )
  if (!manifest.ok) throw new Error('Could not reach Mojang servers')
  const { versions } = await manifest.json()

  // Try exact match first, then starts-with
  let ver = versions.find(v => v.id === targetVersion)
  if (!ver) ver = versions.find(v => v.id.startsWith(targetVersion))
  if (!ver) ver = versions.find(v => v.type === 'release') // fallback: latest release

  const metadata = await fetch(ver.url).then(r => r.json())
  return {
    serverUrl: metadata.downloads.server.url,
    resolvedVersion: ver.id,
  }
}

// ── Generate the .bat launch script content ───────────────────────────────────
function makeBatScript(version, serverUrl, packName) {
  return `@echo off
title Ferrum Test Server - Minecraft ${version}
setlocal enabledelayedexpansion

echo.
echo  =============================================
echo    Ferrum Minecraft Test Server
echo    Version: ${version}
echo  =============================================
echo.

set "SCRIPT_DIR=%~dp0"
set "SERVER_DIR=%SCRIPT_DIR%server"
set "JAVA_DIR=%SCRIPT_DIR%java_portable"

:: ── Java ──────────────────────────────────────────────────────────
java -version >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA_CMD=java"
    echo [OK] Java found on PATH
    goto :java_ready
)

if exist "%JAVA_DIR%\\bin\\java.exe" (
    set "JAVA_CMD=%JAVA_DIR%\\bin\\java.exe"
    echo [OK] Portable Java found
    goto :java_ready
)

echo [..] Java not found. Downloading portable Java 21...
if not exist "%JAVA_DIR%" mkdir "%JAVA_DIR%"
curl -# -L "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%%2B11/OpenJDK21U-jre_x64_windows_hotspot_21.0.5_11.zip" -o "%JAVA_DIR%\\jre.zip"
if %errorlevel% neq 0 (
    echo [!!] Failed to download Java. Please install Java 17+ from https://adoptium.net
    pause & exit /b 1
)
echo [..] Extracting Java...
powershell -Command "Expand-Archive -Path '%JAVA_DIR%\\jre.zip' -DestinationPath '%JAVA_DIR%\\tmp' -Force"
for /d %%i in ("%JAVA_DIR%\\tmp\\*") do ( xcopy /E /I /Q "%%i\\*" "%JAVA_DIR%\\" >nul )
rmdir /S /Q "%JAVA_DIR%\\tmp" & del "%JAVA_DIR%\\jre.zip"
set "JAVA_CMD=%JAVA_DIR%\\bin\\java.exe"
echo [OK] Java installed

:java_ready

:: ── Server JAR ────────────────────────────────────────────────────
if not exist "%SERVER_DIR%" mkdir "%SERVER_DIR%"
if not exist "%SERVER_DIR%\\server.jar" (
    echo [..] Downloading Minecraft ${version} server...
    curl -# -L "${serverUrl}" -o "%SERVER_DIR%\\server.jar"
    if %errorlevel% neq 0 ( echo [!!] Server download failed. & pause & exit /b 1 )
    echo [OK] Server downloaded
) else (
    echo [OK] Server jar already present
)

:: ── Accept EULA ───────────────────────────────────────────────────
echo eula=true> "%SERVER_DIR%\\eula.txt"

:: ── Server properties ─────────────────────────────────────────────
if not exist "%SERVER_DIR%\\server.properties" (
    (
        echo online-mode=false
        echo server-port=25565
        echo level-name=world
        echo max-players=5
        echo difficulty=peaceful
        echo gamemode=creative
        echo motd=Ferrum Dev Server ^| ${version}
        echo enable-command-block=true
        echo spawn-protection=0
    ) > "%SERVER_DIR%\\server.properties"
)

:: ── Copy datapack ─────────────────────────────────────────────────
set "PACK_DEST=%SERVER_DIR%\\world\\datapacks\\${packName}"
if not exist "%PACK_DEST%" mkdir "%PACK_DEST%"
xcopy /E /I /Y "%SCRIPT_DIR%datapack\\*" "%PACK_DEST%\\" >nul
echo [OK] Datapack installed at world/datapacks/${packName}

echo.
echo  =============================================
echo    Server starting on  localhost:25565
echo    Open Minecraft ${version} ^> Multiplayer
echo    Add server: localhost
echo  =============================================
echo.

cd /d "%SERVER_DIR%"
"%JAVA_CMD%" -Xmx2G -Xms512M -jar server.jar nogui

echo.
echo Server stopped.
pause
`
}

// ── Build and download the ZIP package ───────────────────────────────────────
export async function buildAndDownloadLaunchPackage(project, files, onStatus) {
  onStatus('Fetching server info from Mojang...')
  const { serverUrl, resolvedVersion } = await getServerDownloadUrl(
    project.version || '1.21'
  )

  onStatus('Building launch package...')
  const zip = new JSZip()
  const packName = (project.namespace || 'datapack').replace(/[^a-z0-9_]/gi, '_')

  // Add batch script
  const bat = makeBatScript(resolvedVersion, serverUrl, packName)
  zip.file('launch_server.bat', bat)

  // Add README
  zip.file('README.txt', [
    `Ferrum Test Server — ${project.name}`,
    `Minecraft version: ${resolvedVersion}`,
    ``,
    `HOW TO USE:`,
    `1. Run "launch_server.bat" (double-click)`,
    `2. Wait for the server to start (first run downloads Java + Minecraft)`,
    `3. Open Minecraft ${resolvedVersion} → Multiplayer → Add Server`,
    `4. Server address: localhost`,
    `5. Join and test your datapack!`,
    ``,
    `The server runs in offline mode (no Minecraft account needed).`,
    `Your datapack is at: server/world/datapacks/${packName}`,
    ``,
    `To stop: press Ctrl+C in the server window.`,
    `To reload your datapack in-game: type /reload`,
  ].join('\n'))

  // Add all datapack files
  const dpFolder = zip.folder('datapack')
  const dpRoot = project.datpackRoot || ''
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith(dpRoot)) continue
    const rel = path.slice(dpRoot.length).replace(/^[\\/]/, '')
    if (!rel) continue
    // Skip binary/data-url files (textures handled by resourcepack)
    if (typeof content === 'string' && content.startsWith('data:')) continue
    dpFolder.file(rel, content)
  }

  onStatus('Generating ZIP...')
  const blob = await zip.generateAsync({ type: 'blob' })
  const filename = `ferrum_test_${packName}_mc${resolvedVersion}.zip`
  saveAs(blob, filename)
  onStatus('Downloaded!')
  return resolvedVersion
}
