import { create } from 'zustand'
import { scaffoldProject } from '../utils/scaffoldUtils'

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadSavedProjects() {
  try { return JSON.parse(localStorage.getItem('ferrum_projects') || '[]') }
  catch { return [] }
}
function persistSavedProjects(list) {
  try { localStorage.setItem('ferrum_projects', JSON.stringify(list)) }
  catch {}
}

const useStore = create((set, get) => ({
  // ── Project meta ──────────────────────────────────────────────────────────
  project: null,
  // { name, namespace, description, version, author, datpackRoot, resourcepackRoot }

  // ── Virtual filesystem ────────────────────────────────────────────────────
  files: {},         // { [path]: string content }
  dirtyFiles: {},    // { [path]: boolean }

  // ── Editor tabs ───────────────────────────────────────────────────────────
  openTabs: [],      // [{ path, type }]
  activeTab: null,   // path string

  // ── UI state ──────────────────────────────────────────────────────────────
  sidebarWidth: 240,
  rightPanelWidth: 320,
  rightPanel: 'assets',   // 'assets' | 'ai' | 'preview'
  sidebarExpanded: {},     // { [folderPath]: boolean }

  // ── Saved projects (persisted to localStorage) ────────────────────────────
  savedProjects: loadSavedProjects(),  // [{ id, name, savedAt, project, files }]

  // ── Dialogs ───────────────────────────────────────────────────────────────
  dialogs: {
    newProject:    false,
    settings:      false,
    importExport:  false,
    itemPicker:    false,
    projects:      false,
  },
  itemPickerCallback: null,  // fn(itemId) called when user picks item

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    aiApiKey:  '',
    aiModel:   'claude-opus-4-6',
    fontSize:  14,
    tabSize:   2,
    wordWrap:  false,
    autoSave:  false,
    theme:     'dark-blue',
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: null,   // { message, type: 'success'|'error'|'info' }

  // ─────────────────────────────────────────────────────────────────────────
  //  ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  createProject(config) {
    const { files, datpackRoot, resourcepackRoot, namespace } = scaffoldProject(config)
    set({
      project: {
        name: config.name,
        namespace,
        description: config.description,
        version: config.version,
        author: config.author,
        datpackRoot,
        resourcepackRoot,
      },
      files,
      dirtyFiles: {},
      openTabs: [],
      activeTab: null,
      sidebarExpanded: {
        [datpackRoot]: true,
        [`${datpackRoot}/data`]: true,
        [`${datpackRoot}/data/${namespace}`]: true,
        [`${datpackRoot}/data/${namespace}/functions`]: true,
        [resourcepackRoot]: true,
      },
    })
    // Auto-open load.mcfunction
    const loadFn = `${datpackRoot}/data/${namespace}/functions/load.mcfunction`
    if (files[loadFn] !== undefined) {
      get().openFile(loadFn)
    }
    get().showToast(`Project "${config.name}" created!`, 'success')
  },

  openFile(path) {
    const { files, openTabs } = get()
    if (files[path] === undefined) return
    // Skip hidden/gitkeep files
    if (path.endsWith('.gitkeep')) return

    const alreadyOpen = openTabs.find(t => t.path === path)
    if (!alreadyOpen) {
      set(s => ({ openTabs: [...s.openTabs, { path }] }))
    }
    set({ activeTab: path })
  },

  closeTab(path) {
    set(s => {
      const newTabs = s.openTabs.filter(t => t.path !== path)
      let newActive = s.activeTab
      if (s.activeTab === path) {
        const idx = s.openTabs.findIndex(t => t.path === path)
        newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.path || null
      }
      const newDirty = { ...s.dirtyFiles }
      delete newDirty[path]
      return { openTabs: newTabs, activeTab: newActive, dirtyFiles: newDirty }
    })
  },

  setActiveTab(path) { set({ activeTab: path }) },

  updateFile(path, content) {
    set(s => ({
      files: { ...s.files, [path]: content },
      dirtyFiles: { ...s.dirtyFiles, [path]: true },
    }))
  },

  saveFile(path) {
    set(s => {
      const d = { ...s.dirtyFiles }
      delete d[path]
      return { dirtyFiles: d }
    })
    get().showToast('Saved', 'success')
  },

  saveAll() {
    set({ dirtyFiles: {} })
    get().saveCurrentProject()
    get().showToast('All files saved', 'success')
  },

  saveCurrentProject() {
    const { project, files, savedProjects } = get()
    if (!project) return
    const now = new Date().toISOString()
    // Update existing entry if same project name exists, else create new
    const existing = savedProjects.findIndex(p => p.name === project.name)
    const entry = { id: existing >= 0 ? savedProjects[existing].id : now, name: project.name, savedAt: now, project, files }
    const updated = existing >= 0
      ? savedProjects.map((p, i) => i === existing ? entry : p)
      : [...savedProjects, entry]
    persistSavedProjects(updated)
    set({ savedProjects: updated, dirtyFiles: {} })
  },

  loadSavedProject(id) {
    const { savedProjects } = get()
    const entry = savedProjects.find(p => p.id === id)
    if (!entry) return
    const loadFn = `${entry.project.datpackRoot}/data/${entry.project.namespace}/functions/load.mcfunction`
    set({
      project: entry.project,
      files: entry.files,
      dirtyFiles: {},
      openTabs: [],
      activeTab: null,
      sidebarExpanded: {
        [entry.project.datpackRoot]: true,
        [`${entry.project.datpackRoot}/data`]: true,
        [`${entry.project.datpackRoot}/data/${entry.project.namespace}`]: true,
        [`${entry.project.datpackRoot}/data/${entry.project.namespace}/functions`]: true,
        [entry.project.resourcepackRoot]: true,
      },
    })
    if (entry.files[loadFn] !== undefined) get().openFile(loadFn)
    get().closeDialog('projects')
    get().showToast(`Loaded "${entry.name}"`, 'success')
  },

  deleteSavedProject(id) {
    const updated = get().savedProjects.filter(p => p.id !== id)
    persistSavedProjects(updated)
    set({ savedProjects: updated })
    get().showToast('Project deleted', 'info')
  },

  createFile(path, content = '') {
    set(s => ({ files: { ...s.files, [path]: content } }))
    get().openFile(path)
  },

  deleteFile(path) {
    set(s => {
      const f = { ...s.files }
      delete f[path]
      const tabs = s.openTabs.filter(t => t.path !== path)
      const active = s.activeTab === path
        ? tabs[tabs.length - 1]?.path || null
        : s.activeTab
      return { files: f, openTabs: tabs, activeTab: active }
    })
  },

  renameFile(oldPath, newPath) {
    set(s => {
      const f = { ...s.files }
      f[newPath] = f[oldPath]
      delete f[oldPath]
      const tabs = s.openTabs.map(t => t.path === oldPath ? { ...t, path: newPath } : t)
      const active = s.activeTab === oldPath ? newPath : s.activeTab
      return { files: f, openTabs: tabs, activeTab: active }
    })
  },

  importFiles(newFiles) {
    set(s => ({ files: { ...s.files, ...newFiles } }))
    get().showToast(`Imported ${Object.keys(newFiles).length} files`, 'success')
  },

  toggleFolder(path) {
    set(s => ({
      sidebarExpanded: {
        ...s.sidebarExpanded,
        [path]: !s.sidebarExpanded[path],
      },
    }))
  },

  setSidebarWidth(w)    { set({ sidebarWidth: Math.max(160, Math.min(480, w)) }) },
  setRightPanelWidth(w) { set({ rightPanelWidth: Math.max(240, Math.min(600, w)) }) },
  setRightPanel(panel)  { set({ rightPanel: panel }) },

  openDialog(name, extra = {}) {
    set(s => ({ dialogs: { ...s.dialogs, [name]: true }, ...extra }))
  },
  closeDialog(name) {
    set(s => ({ dialogs: { ...s.dialogs, [name]: false } }))
  },

  openItemPicker(callback) {
    set(s => ({
      dialogs: { ...s.dialogs, itemPicker: true },
      itemPickerCallback: callback,
    }))
  },
  closeItemPicker() {
    set(s => ({
      dialogs: { ...s.dialogs, itemPicker: false },
      itemPickerCallback: null,
    }))
  },
  pickItem(itemId) {
    const cb = get().itemPickerCallback
    if (cb) cb(itemId)
    get().closeItemPicker()
  },

  updateSettings(partial) {
    set(s => ({ settings: { ...s.settings, ...partial } }))
  },

  showToast(message, type = 'info') {
    set({ toast: { message, type } })
    setTimeout(() => {
      if (get().toast?.message === message) set({ toast: null })
    }, 3000)
  },
}))

export default useStore
