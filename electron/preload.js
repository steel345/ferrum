'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Minecraft detection & launch ──────────────────────────────────────────
  detectMinecraft: () => ipcRenderer.invoke('detect-minecraft'),
  launchMinecraft: (opts) => ipcRenderer.invoke('launch-minecraft', opts),
  stopMinecraft: () => ipcRenderer.invoke('stop-minecraft'),

  // ── File system ───────────────────────────────────────────────────────────
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),

  // ── MC event listeners ────────────────────────────────────────────────────
  onMcLog: (cb) => ipcRenderer.on('mc-log', (_event, line) => cb(line)),
  onMcStopped: (cb) => ipcRenderer.on('mc-stopped', (_event, info) => cb(info)),

  // ── Auto-updater listeners ────────────────────────────────────────────────
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_event, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_event, info) => cb(info)),

  // ── Window controls ───────────────────────────────────────────────────────
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // ── Projects persistence ──────────────────────────────────────────────────
  saveProjects: (json) => ipcRenderer.invoke('save-projects', json),
  loadProjects: ()     => ipcRenderer.invoke('load-projects'),

  // ── Free AI (CORS-free via Node.js) ──────────────────────────────────────
  freeAIRequest: (opts) => ipcRenderer.invoke('free-ai-request', opts),

  // ── Shell / Explorer ─────────────────────────────────────────────────────
  openInExplorer: (opts) => ipcRenderer.invoke('open-in-explorer', opts),

  // ── Identity flag ─────────────────────────────────────────────────────────
  isElectron: true,
})
