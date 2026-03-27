import React, { useState, useMemo } from 'react'
import useStore from '../../store/useStore'

const MC_COLORS = {
  black: '#000000', dark_blue: '#0000AA', dark_green: '#00AA00', dark_aqua: '#00AAAA',
  dark_red: '#AA0000', dark_purple: '#AA00AA', gold: '#FFAA00', gray: '#AAAAAA',
  dark_gray: '#555555', blue: '#5555FF', green: '#55FF55', aqua: '#55FFFF',
  red: '#FF5555', light_purple: '#FF55FF', yellow: '#FFFF55', white: '#FFFFFF',
}

function renderComponent(comp, key = 0) {
  if (typeof comp === 'string') return <span key={key}>{comp}</span>
  if (Array.isArray(comp)) return <>{comp.map((c, i) => renderComponent(c, i))}</>

  const style = {
    color: MC_COLORS[comp.color] || comp.color || '#FFFFFF',
    fontWeight: comp.bold ? 'bold' : undefined,
    fontStyle: comp.italic ? 'italic' : undefined,
    textDecoration: [
      comp.underlined && 'underline',
      comp.strikethrough && 'line-through',
    ].filter(Boolean).join(' ') || undefined,
    opacity: comp.obfuscated ? 0 : undefined,
  }

  return (
    <span key={key} style={style} title={comp.hoverEvent ? JSON.stringify(comp.hoverEvent) : undefined}>
      {comp.translate ? `[${comp.translate}]` : comp.text || ''}
      {(comp.extra || []).map((e, i) => renderComponent(e, `${key}-${i}`))}
    </span>
  )
}

const DISPLAY_MODES = [
  { id: 'chat',      label: 'Chat',      bg: 'rgba(0,0,0,0.4)' },
  { id: 'title',     label: 'Title',     bg: 'rgba(0,0,0,0.0)' },
  { id: 'subtitle',  label: 'Subtitle',  bg: 'rgba(0,0,0,0.0)' },
  { id: 'actionbar', label: 'Actionbar', bg: 'rgba(0,0,0,0.4)' },
]

const SAMPLE_PRESETS = [
  { label: 'Simple text',       value: '{"text":"Hello, world!","color":"white"}' },
  { label: 'Colored + bold',    value: '{"text":"Warning! ","color":"red","bold":true,"extra":[{"text":"Something happened","color":"yellow"}]}' },
  { label: 'Player name',       value: '{"text":"","extra":[{"selector":"@s"},{"text":" joined the game","color":"yellow"}]}' },
  { label: 'Clickable link',    value: '{"text":"Click me!","color":"aqua","underlined":true,"clickEvent":{"action":"open_url","value":"https://minecraft.net"}}' },
  { label: 'Score display',     value: '{"text":"Score: ","color":"gold","extra":[{"score":{"name":"@s","objective":"points"},"color":"white"}]}' },
  { label: 'Multi-line array',  value: '[{"text":"Line 1\\n","color":"green"},{"text":"Line 2","color":"aqua"}]' },
]

export default function TellrawPreview() {
  const activeTab = useStore(s => s.activeTab)
  const files = useStore(s => s.files)
  const [input, setInput] = useState('{"text":"Hello, ","color":"white","extra":[{"text":"world","color":"aqua","bold":true},{"text":"!","color":"white"}]}')
  const [mode, setMode] = useState('chat')

  // Parse input without calling setState during render (that causes infinite loops)
  const { parsed, parseError } = useMemo(() => {
    try { return { parsed: JSON.parse(input), parseError: '' } }
    catch (e) { return { parsed: null, parseError: e.message } }
  }, [input])

  const handleChange = (v) => {
    setInput(v)
  }

  // Try to auto-load from active file if it looks like a tellraw command
  const autoContent = activeTab && files[activeTab]
    ? files[activeTab].split('\n')
        .find(line => line.trim().startsWith('tellraw'))
        ?.replace(/^.*?tellraw\s+@[aeprs](?:\[.*?\])?\s+/, '')
        ?.trim()
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
        <div>
          <p className="label">Tellraw JSON</p>
          <textarea
            className="input font-mono text-xs resize-none"
            rows={5}
            value={input}
            onChange={e => handleChange(e.target.value)}
            placeholder='{"text":"Hello!","color":"white"}'
          />
          {parseError && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{parseError}</p>}
          {autoContent && autoContent !== input && (
            <button className="btn btn-secondary text-xs py-1 px-2 mt-1"
              onClick={() => handleChange(autoContent)}>
              Load from active file
            </button>
          )}
        </div>

        {/* Presets */}
        <div>
          <p className="label">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRESETS.map(p => (
              <button key={p.label}
                className="btn btn-secondary text-xs py-0.5 px-2"
                onClick={() => handleChange(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display mode */}
        <div>
          <p className="label">Display Mode</p>
          <div className="flex gap-1.5">
            {DISPLAY_MODES.map(m => (
              <button key={m.id}
                className="px-3 py-1 rounded text-xs transition-colors"
                style={{ background: mode === m.id ? '#2563eb' : '#0b1525', color: mode === m.id ? '#fff' : '#64748b', border: '1px solid #1a3050' }}
                onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div>
          <p className="label">Preview</p>
          <div className="rounded-lg overflow-hidden relative"
            style={{ background: '#1a1a2e', border: '1px solid #1a3050', minHeight: 80 }}>
            {/* Minecraft-like background */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")',
              opacity: 0.1,
            }} />
            <div className="relative p-4 flex items-center justify-center">
              <div
                className="font-mono text-sm"
                style={{
                  background: DISPLAY_MODES.find(m2 => m2.id === mode)?.bg,
                  padding: '4px 8px',
                  borderRadius: 2,
                  fontSize: mode === 'title' ? 28 : mode === 'subtitle' ? 16 : 14,
                  fontFamily: '"Segoe UI", sans-serif',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                }}
              >
                {parsed ? renderComponent(parsed) : (
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    {parseError ? `Parse error: ${parseError}` : 'Type JSON above to preview'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color palette reference */}
        <div>
          <p className="label">Color Reference</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {Object.entries(MC_COLORS).map(([name, hex]) => (
              <button
                key={name}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors text-left"
                onClick={() => navigator.clipboard.writeText(name)}
                title={`Click to copy "${name}"`}
              >
                <span className="w-3 h-3 rounded-sm shrink-0 inline-block" style={{ background: hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ color: '#94a3b8', fontSize: 10 }}>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
