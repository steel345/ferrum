import React from 'react'
import useStore from '../../store/useStore'
import { X } from 'lucide-react'

export default function SettingsDialog() {
  const { settings, updateSettings, closeDialog } = useStore()
  const s = settings

  return (
    <div className="dialog-overlay" onClick={() => closeDialog('settings')}>
      <div className="dialog fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="dialog-title">Settings</h2>
            <p className="dialog-subtitle mb-0">Configure your editor preferences</p>
          </div>
          <button className="btn btn-ghost p-1.5" onClick={() => closeDialog('settings')}><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Editor */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Editor</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#e2e8f0' }}>Font Size</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Monaco editor font size in pixels</p>
                </div>
                <input type="number" min="10" max="24" className="input w-20 text-sm"
                  value={s.fontSize} onChange={e => updateSettings({ fontSize: parseInt(e.target.value) || 14 })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#e2e8f0' }}>Tab Size</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Number of spaces per tab</p>
                </div>
                <select className="select w-20 text-sm" value={s.tabSize}
                  onChange={e => updateSettings({ tabSize: parseInt(e.target.value) })}>
                  {[2,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#e2e8f0' }}>Word Wrap</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Wrap long lines in the editor</p>
                </div>
                <button
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: s.wordWrap ? '#2563eb' : '#1a3050' }}
                  onClick={() => updateSettings({ wordWrap: !s.wordWrap })}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                    style={{ left: s.wordWrap ? '26px' : '4px' }} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#e2e8f0' }}>Auto Save</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Automatically save files on change</p>
                </div>
                <button
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: s.autoSave ? '#2563eb' : '#1a3050' }}
                  onClick={() => updateSettings({ autoSave: !s.autoSave })}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                    style={{ left: s.autoSave ? '26px' : '4px' }} />
                </button>
              </div>
            </div>
          </section>

          {/* AI */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>AI (Claude API)</h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm mb-1" style={{ color: '#e2e8f0' }}>API Key</p>
                <input type="password" className="input text-sm font-mono"
                  placeholder="sk-ant-api03-..."
                  value={s.aiApiKey}
                  onChange={e => updateSettings({ aiApiKey: e.target.value })} />
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  Your key is stored only in browser memory and never sent anywhere except Anthropic's API.
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#e2e8f0' }}>Default Model</p>
                <select className="select w-full text-sm" value={s.aiModel}
                  onChange={e => updateSettings({ aiModel: e.target.value })}>
                  <option value="claude-opus-4-6">Claude Opus 4.6 — Most capable</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Fast & capable</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — Fastest</option>
                </select>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>About</h3>
            <div className="p-3 rounded-lg" style={{ background: '#0a1220', border: '1px solid #1a3050' }}>
              <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>🔩 Ferrum — Minecraft Datapack IDE</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                Purpose-built for Minecraft datapack and resourcepack development.
                Version 0.1.0 · Built with React + Monaco + Zustand.
              </p>
              <p className="text-xs mt-2" style={{ color: '#334155' }}>
                Note: Local Minecraft install integration, FTP upload, and world installation will be available in the desktop (Electron) version.
              </p>
            </div>
          </section>
        </div>

        <div className="flex justify-end mt-6">
          <button className="btn btn-primary" onClick={() => closeDialog('settings')}>Done</button>
        </div>
      </div>
    </div>
  )
}
