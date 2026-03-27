import React from 'react'
import useStore from '../../store/useStore'
import { Save, Upload, Download, Settings, Plus, FolderOpen, Archive } from 'lucide-react'
import { exportZip } from '../../utils/zipUtils'
import { MC_VERSIONS } from '../../data/minecraftData'
import { isElectron, electronAPI } from '../../utils/electronBridge'

export default function Toolbar() {
  const { project, files, dirtyFiles, openDialog, saveAll, showToast, saveCurrentProject } = useStore()
  const hasDirty = Object.keys(dirtyFiles).length > 0

  async function handleExport() {
    if (!project) return
    try {
      await exportZip(files, project.name)
      showToast('Exported ZIP!', 'success')
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error')
    }
  }

  const mcver = project ? MC_VERSIONS.find(v => v.id === project.version) : null

  return (
    <div className="flex items-center gap-2 px-3 h-11 shrink-0 select-none"
      style={{
        background: '#040810',
        borderBottom: '1px solid #1a3050',
        WebkitAppRegion: isElectron ? 'drag' : 'no-drag',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <span className="text-lg">🔩</span>
        <span className="font-bold text-sm tracking-tight" style={{ color: '#e2e8f0' }}>Ferrum</span>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Projects */}
        <button className="btn btn-ghost px-2 py-1.5 rounded flex items-center gap-1.5 text-xs"
          onClick={() => openDialog('projects')}
          title="My Projects">
          <Archive size={14} />
          <span>Projects</span>
        </button>

        {/* New project */}
        <button className="btn btn-ghost px-2 py-1.5 rounded flex items-center gap-1.5 text-xs"
          onClick={() => openDialog('newProject')}
          title="New Project">
          <Plus size={14} />
          <span>New</span>
        </button>

        {/* Save all */}
        {project && (
          <button
            className={`btn px-2 py-1.5 rounded flex items-center gap-1.5 text-xs ${hasDirty ? 'btn-primary' : 'btn-ghost'}`}
            onClick={saveAll}
            title="Save Project (Ctrl+S)">
            <Save size={14} />
            <span>Save</span>
            {hasDirty && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />}
          </button>
        )}

        <div className="w-px h-5 mx-1" style={{ background: '#1a3050' }} />

        {/* Import */}
        <button className="btn btn-ghost px-2 py-1.5 rounded flex items-center gap-1.5 text-xs"
          onClick={() => openDialog('importExport')}
          title="Import / Export">
          <Upload size={14} />
          <span>Import</span>
        </button>

        {/* Export */}
        {project && (
          <button className="btn btn-ghost px-2 py-1.5 rounded flex items-center gap-1.5 text-xs"
            onClick={handleExport}
            title="Export ZIP">
            <Download size={14} />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Version badge */}
      {project && mcver && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: '#0b1525', border: '1px solid #1a3050', color: '#94a3b8' }}>
          <span className="text-green-400">⬡</span>
          MC {project.version}
          <span style={{ color: '#334155' }}>·</span>
          <span style={{ color: '#64748b' }}>DP {mcver.datapack}</span>
        </div>
      )}

      {/* Namespace badge */}
      {project && (
        <div className="px-3 py-1 rounded-full text-xs font-mono"
          style={{ background: '#0b1525', border: '1px solid #1a3050', color: '#93c5fd' }}>
          {project.namespace}:
        </div>
      )}

      <div className="w-px h-5 mx-1" style={{ background: '#1a3050' }} />

      {/* Settings */}
      <button className="btn btn-ghost p-1.5 rounded" onClick={() => openDialog('settings')} title="Settings"
        style={{ WebkitAppRegion: 'no-drag' }}>
        <Settings size={15} />
      </button>

      {/* Window controls — only in Electron */}
      {isElectron && (
        <div className="flex items-center gap-1 ml-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={() => electronAPI.minimizeWindow()}
            title="Minimise"
            style={{
              width: 12, height: 12, borderRadius: '50%', border: 'none',
              background: '#f59e0b', cursor: 'pointer', flexShrink: 0,
            }}
          />
          <button
            onClick={() => electronAPI.maximizeWindow()}
            title="Maximise / Restore"
            style={{
              width: 12, height: 12, borderRadius: '50%', border: 'none',
              background: '#22c55e', cursor: 'pointer', flexShrink: 0,
            }}
          />
          <button
            onClick={() => electronAPI.closeWindow()}
            title="Close"
            style={{
              width: 12, height: 12, borderRadius: '50%', border: 'none',
              background: '#ef4444', cursor: 'pointer', flexShrink: 0,
            }}
          />
        </div>
      )}
    </div>
  )
}
