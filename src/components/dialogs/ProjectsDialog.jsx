import React from 'react'
import useStore from '../../store/useStore'
import { X, FolderOpen, Trash2, Save, Clock, Package } from 'lucide-react'

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

export default function ProjectsDialog() {
  const { savedProjects, loadSavedProject, deleteSavedProject, saveCurrentProject, project, closeDialog } = useStore()

  return (
    <div className="dialog-overlay" onClick={() => closeDialog('projects')}>
      <div className="dialog fade-in" onClick={e => e.stopPropagation()} style={{ width: 580 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="dialog-title">Projects</h2>
            <p className="dialog-subtitle mb-0">Your saved Ferrum projects</p>
          </div>
          <div className="flex items-center gap-2">
            {project && (
              <button
                className="btn btn-primary flex items-center gap-2 text-sm"
                onClick={() => { saveCurrentProject(); }}
              >
                <Save size={14} />
                Save Current
              </button>
            )}
            <button className="btn btn-ghost p-1.5 rounded" onClick={() => closeDialog('projects')}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Projects list */}
        {savedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package size={40} style={{ color: '#1a3050' }} />
            <p style={{ color: '#334155', fontSize: 14 }}>No saved projects yet</p>
            <p style={{ color: '#1e3050', fontSize: 12 }}>
              Create a project and hit <strong style={{ color: '#64748b' }}>Save</strong> to see it here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {savedProjects.map(p => (
              <div
                key={p.id}
                style={{
                  background: '#060c18',
                  border: '1px solid #1a3050',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3050'}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  📦
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{p.project?.namespace}:</span>
                    <span>MC {p.project?.version}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      {formatDate(p.savedAt)}
                    </span>
                    <span>{Object.keys(p.files || {}).filter(f => !f.endsWith('.gitkeep')).length} files</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-primary text-xs"
                    style={{ padding: '6px 14px' }}
                    onClick={() => loadSavedProject(p.id)}
                  >
                    <FolderOpen size={13} />
                    Open
                  </button>
                  <button
                    className="btn btn-danger text-xs"
                    style={{ padding: '6px 10px' }}
                    onClick={() => deleteSavedProject(p.id)}
                    title="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button className="btn btn-secondary" onClick={() => closeDialog('projects')}>Close</button>
        </div>
      </div>
    </div>
  )
}
