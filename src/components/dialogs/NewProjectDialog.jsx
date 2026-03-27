import React, { useState } from 'react'
import useStore from '../../store/useStore'
import { MC_VERSIONS } from '../../data/minecraftData'
import { X, ChevronRight, Package, Layers, Zap } from 'lucide-react'

const TEMPLATES = [
  { id: 'blank',    icon: '📄', label: 'Blank',           desc: 'Empty project with pack.mcmeta and load/tick functions only' },
  { id: 'starter',  icon: '⭐', label: 'Starter',         desc: 'Includes example recipe, loot table, and root advancement' },
  { id: 'adventure',icon: '🗺️', label: 'Adventure Map',  desc: 'Adds scoreboards, objective setup, and intro cutscene functions' },
]

function FolderPreview({ name, namespace, version }) {
  const ns = namespace || 'mynamespace'
  const dp = `${name || 'myproject'}_datapack`
  const rp = `${name || 'myproject'}_resourcepack`
  const items = [
    { indent: 0, label: dp, icon: '📦', color: '#3b82f6' },
    { indent: 1, label: 'pack.mcmeta', icon: '📄', color: '#38bdf8' },
    { indent: 1, label: 'data/', icon: '📁', color: '#64748b' },
    { indent: 2, label: `${ns}/`, icon: '📁', color: '#64748b' },
    { indent: 3, label: 'functions/', icon: '📁', color: '#fbbf24' },
    { indent: 4, label: 'load.mcfunction', icon: '⚡', color: '#fbbf24' },
    { indent: 4, label: 'tick.mcfunction', icon: '⚡', color: '#fbbf24' },
    { indent: 3, label: 'recipes/', icon: '📁', color: '#34d399' },
    { indent: 3, label: 'loot_tables/', icon: '📁', color: '#a78bfa' },
    { indent: 0, label: rp, icon: '📦', color: '#a855f7', mt: true },
    { indent: 1, label: 'pack.mcmeta', icon: '📄', color: '#38bdf8' },
    { indent: 1, label: 'assets/', icon: '📁', color: '#64748b' },
    { indent: 2, label: `${ns}/`, icon: '📁', color: '#64748b' },
    { indent: 3, label: 'models/', icon: '📁', color: '#64748b' },
    { indent: 3, label: 'textures/', icon: '📁', color: '#64748b' },
    { indent: 3, label: 'lang/', icon: '📁', color: '#64748b' },
  ]
  return (
    <div className="rounded-lg p-3 font-mono text-xs overflow-hidden"
      style={{ background: '#040810', border: '1px solid #1a3050' }}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 py-0.5"
          style={{ paddingLeft: item.indent * 12, marginTop: item.mt ? 6 : 0 }}>
          <span>{item.icon}</span>
          <span style={{ color: item.color }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function NewProjectDialog() {
  const { createProject, closeDialog } = useStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name:        '',
    namespace:   '',
    description: '',
    version:     '1.21.1',
    author:      '',
    template:    'blank',
  })

  function set(key, value) {
    setForm(f => {
      const next = { ...f, [key]: value }
      // Auto-fill namespace from name
      if (key === 'name' && (!f.namespace || f.namespace === autoNamespace(f.name))) {
        next.namespace = autoNamespace(value)
      }
      return next
    })
  }

  function autoNamespace(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  }

  const canNext1 = form.name.trim() && form.namespace.trim()

  function create() {
    createProject(form)
    closeDialog('newProject')
  }

  return (
    <div className="dialog-overlay" onClick={() => closeDialog('newProject')}>
      <div className="dialog fade-in" onClick={e => e.stopPropagation()} style={{ width: 640 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="dialog-title">New Project</h2>
            <p className="dialog-subtitle mb-0">Create a linked datapack + resourcepack workspace</p>
          </div>
          <button className="btn btn-ghost p-1.5 rounded" onClick={() => closeDialog('newProject')}>
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: step === s ? '#2563eb' : step > s ? '#16a34a' : '#1a3050',
                    color: step >= s ? '#fff' : '#64748b',
                  }}>
                  {step > s ? '✓' : s}
                </div>
                <span className="text-xs" style={{ color: step === s ? '#e2e8f0' : '#64748b' }}>
                  {s === 1 ? 'Info' : s === 2 ? 'Version' : 'Template'}
                </span>
              </div>
              {s < 3 && <div className="flex-1 h-px" style={{ background: step > s ? '#16a34a' : '#1a3050' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="flex gap-6">
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <label className="label">Project Name *</label>
                <input className="input" placeholder="example" value={form.name}
                  onChange={e => set('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Namespace *</label>
                <input className="input font-mono" placeholder="example" value={form.namespace}
                  onChange={e => set('namespace', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  Used in file paths: <code style={{ color: '#93c5fd' }}>{form.namespace || 'namespace'}:function_name</code>
                </p>
              </div>
              <div>
                <label className="label">Author</label>
                <input className="input" placeholder="Your name" value={form.author}
                  onChange={e => set('author', e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="A short description of your pack"
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
            <div className="w-52 shrink-0">
              <p className="label">Project Structure Preview</p>
              <FolderPreview name={form.name} namespace={form.namespace} version={form.version} />
            </div>
          </div>
        )}

        {/* Step 2: Version */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Minecraft Version</label>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {MC_VERSIONS.map(v => (
                  <button
                    key={v.id}
                    className="flex flex-col items-start p-3 rounded-lg transition-all text-left"
                    style={{
                      background: form.version === v.id ? '#1e3a6b' : '#0b1525',
                      border: `1px solid ${form.version === v.id ? '#2563eb' : '#1a3050'}`,
                    }}
                    onClick={() => set('version', v.id)}
                  >
                    <span className="text-sm font-semibold" style={{ color: form.version === v.id ? '#93c5fd' : '#e2e8f0' }}>
                      {v.label}
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      DP:{v.datapack} · RP:{v.resourcepack}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Template */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className="flex items-start gap-4 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: form.template === t.id ? '#1e3a6b' : '#0b1525',
                    border: `1px solid ${form.template === t.id ? '#2563eb' : '#1a3050'}`,
                  }}
                  onClick={() => set('template', t.id)}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{t.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{t.desc}</div>
                  </div>
                  {form.template === t.id && (
                    <div className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ background: '#2563eb' }}>✓</div>
                  )}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl" style={{ background: '#0a1220', border: '1px solid #1a3050' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span style={{ color: '#64748b' }}>Project</span>
                <span style={{ color: '#e2e8f0' }}>{form.name || '—'}</span>
                <span style={{ color: '#64748b' }}>Namespace</span>
                <span style={{ color: '#93c5fd', fontFamily: 'monospace' }}>{form.namespace || '—'}</span>
                <span style={{ color: '#64748b' }}>Version</span>
                <span style={{ color: '#e2e8f0' }}>{form.version}</span>
                <span style={{ color: '#64748b' }}>Template</span>
                <span style={{ color: '#e2e8f0' }}>{TEMPLATES.find(t => t.id === form.template)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <button
            className="btn btn-secondary"
            onClick={() => step > 1 ? setStep(s => s - 1) : closeDialog('newProject')}
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                className="btn btn-primary"
                disabled={step === 1 && !canNext1}
                style={{ opacity: step === 1 && !canNext1 ? 0.5 : 1 }}
                onClick={() => setStep(s => s + 1)}
              >
                Next →
              </button>
            ) : (
              <button className="btn btn-primary px-6" onClick={create} disabled={!canNext1}>
                ✨ Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
