import React, { useRef, useCallback, useEffect } from 'react'
import useStore from './store/useStore'

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', width: '100vw', background: '#060c18',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
        }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ color: '#f87171', fontWeight: 700, fontSize: 16 }}>Something went wrong</p>
          <pre style={{
            color: '#64748b', fontSize: 12, background: '#0b1525',
            border: '1px solid #1a3050', borderRadius: 8, padding: 16,
            maxWidth: 600, overflowX: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
          </pre>
          <button
            style={{
              background: '#2563eb', border: 'none', borderRadius: 8,
              color: '#fff', fontWeight: 600, fontSize: 14,
              padding: '10px 24px', cursor: 'pointer',
            }}
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import Toolbar from './components/layout/Toolbar'
import Sidebar from './components/layout/Sidebar'
import EditorArea from './components/layout/EditorArea'
import StatusBar from './components/layout/StatusBar'
import RightPanel from './components/layout/RightPanel'
import NewProjectDialog from './components/dialogs/NewProjectDialog'
import SettingsDialog from './components/dialogs/SettingsDialog'
import ImportExportDialog from './components/dialogs/ImportExportDialog'
import ItemPickerDialog from './components/dialogs/ItemPickerDialog'
import ProjectsDialog from './components/dialogs/ProjectsDialog'
import Toast from './components/ui/Toast'
import WelcomeScreen from './components/layout/WelcomeScreen'
import ActivityBar from './components/layout/ActivityBar'

export default function App() {
  const { project, dialogs, sidebarWidth, rightPanelWidth, setSidebarWidth, setRightPanelWidth } = useStore()

  // ── Auto-save on window close ────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.onBeforeClose) return
    window.electronAPI.onBeforeClose(() => {
      const { project: p, saveCurrentProject } = useStore.getState()
      if (p) saveCurrentProject()
      // Give 600ms for async IPC save to disk to complete, then close
      setTimeout(() => {
        if (window.electronAPI?.closeReady) window.electronAPI.closeReady()
      }, 600)
    })
  }, [])

  // ── Sidebar resize ──────────────────────────────────────────────────────
  const sidebarDrag = useRef(false)
  const onSidebarMouseDown = useCallback((e) => {
    e.preventDefault()
    sidebarDrag.current = true
    const startX = e.clientX
    const startW = sidebarWidth

    const onMove = (ev) => {
      if (!sidebarDrag.current) return
      setSidebarWidth(startW + ev.clientX - startX)
    }
    const onUp = () => {
      sidebarDrag.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth, setSidebarWidth])

  // ── Right panel resize ──────────────────────────────────────────────────
  const rightDrag = useRef(false)
  const onRightMouseDown = useCallback((e) => {
    e.preventDefault()
    rightDrag.current = true
    const startX = e.clientX
    const startW = rightPanelWidth

    const onMove = (ev) => {
      if (!rightDrag.current) return
      setRightPanelWidth(startW - (ev.clientX - startX))
    }
    const onUp = () => {
      rightDrag.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [rightPanelWidth, setRightPanelWidth])

  return (
  <ErrorBoundary>
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#060c18' }}>
      {/* Top toolbar */}
      <Toolbar />

      {/* Main body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Activity bar (far left) */}
        <ActivityBar />

        {/* Sidebar */}
        {project && (
          <>
            <div className="flex flex-col overflow-hidden" style={{ width: sidebarWidth, flexShrink: 0, background: '#08111f', borderRight: '1px solid #1a3050' }}>
              <Sidebar />
            </div>
            {/* Sidebar resize handle */}
            <div className="resize-handle" onMouseDown={onSidebarMouseDown} />
          </>
        )}

        {/* Editor area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {project ? <EditorArea /> : <WelcomeScreen />}
        </div>

        {/* Right panel resize handle */}
        {project && (
          <>
            <div className="resize-handle" onMouseDown={onRightMouseDown} />
            {/* Right panel */}
            <div style={{ width: rightPanelWidth, flexShrink: 0, background: '#08111f', borderLeft: '1px solid #1a3050' }}>
              <RightPanel />
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Dialogs */}
      {dialogs.newProject   && <NewProjectDialog />}
      {dialogs.settings     && <SettingsDialog />}
      {dialogs.importExport && <ImportExportDialog />}
      {dialogs.itemPicker   && <ItemPickerDialog />}
      {dialogs.projects     && <ProjectsDialog />}

      {/* Toast */}
      <Toast />
    </div>
  </ErrorBoundary>
  )
}
