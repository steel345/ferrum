import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { MC_VERSIONS } from '../../data/minecraftData'

function TellrawInline({ text }) {
  // Quick render of a JSON description string with §-codes (Minecraft uses §)
  if (typeof text === 'string') {
    // Replace §X color codes with spans
    const parts = text.split(/(§[0-9a-fklmnor])/i)
    const colorMap = {
      '§0': '#000000', '§1': '#0000AA', '§2': '#00AA00', '§3': '#00AAAA',
      '§4': '#AA0000', '§5': '#AA00AA', '§6': '#FFAA00', '§7': '#AAAAAA',
      '§8': '#555555', '§9': '#5555FF', '§a': '#55FF55', '§b': '#55FFFF',
      '§c': '#FF5555', '§d': '#FF55FF', '§e': '#FFFF55', '§f': '#FFFFFF',
    }
    let currentColor = '#FFFFFF'
    return (
      <span>
        {parts.map((p, i) => {
          if (/^§[0-9a-f]$/i.test(p)) { currentColor = colorMap[p.toLowerCase()] || '#FFFFFF'; return null }
          return <span key={i} style={{ color: currentColor }}>{p}</span>
        })}
      </span>
    )
  }
  if (typeof text === 'object' && text.text) {
    const mc = {
      black:'#000000', dark_blue:'#0000AA', dark_green:'#00AA00', dark_aqua:'#00AAAA',
      dark_red:'#AA0000', dark_purple:'#AA00AA', gold:'#FFAA00', gray:'#AAAAAA',
      dark_gray:'#555555', blue:'#5555FF', green:'#55FF55', aqua:'#55FFFF',
      red:'#FF5555', light_purple:'#FF55FF', yellow:'#FFFF55', white:'#FFFFFF',
    }
    return <span style={{ color: mc[text.color] || text.color || '#FFFFFF' }}>{text.text}</span>
  }
  return <span style={{ color: '#FFFFFF' }}>{JSON.stringify(text)}</span>
}

export default function PackMetaEditor({ path }) {
  const { files, updateFile, saveFile, project } = useStore()
  const [meta, setMeta] = useState(null)

  const isResourcepack = path.includes('resourcepack')

  useEffect(() => {
    try { setMeta(JSON.parse(files[path] || '{}')) }
    catch { setMeta(null) }
  }, [path, files[path]])

  function save(m) {
    setMeta(m)
    updateFile(path, JSON.stringify(m, null, 2))
  }

  function setPack(partial) {
    save({ ...meta, pack: { ...(meta?.pack || {}), ...partial } })
  }

  if (!meta) return <div className="p-4 text-sm" style={{ color: '#64748b' }}>Invalid JSON</div>

  const pack = meta.pack || {}
  const currentVersion = project?.version
  const matchedVersion = MC_VERSIONS.find(v => v.id === currentVersion)
  const suggestedFormat = isResourcepack ? matchedVersion?.resourcepack : matchedVersion?.datapack

  return (
    <div className="flex flex-col h-full overflow-auto p-4" style={{ background: '#060c18' }}>
      <div className="max-w-lg flex flex-col gap-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-bold" style={{ color: '#e2e8f0' }}>
            📦 pack.mcmeta
          </h2>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
            {isResourcepack ? 'Resource Pack' : 'Data Pack'} metadata file
          </p>
        </div>

        {/* Pack format */}
        <div>
          <p className="label">Pack Format</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="4"
              value={pack.pack_format ?? suggestedFormat ?? 4}
              onChange={e => setPack({ pack_format: parseInt(e.target.value) || 4 })}
              className="input text-sm w-24"
            />
            {suggestedFormat && (
              <button className="btn btn-secondary text-xs py-1 px-3"
                onClick={() => setPack({ pack_format: suggestedFormat })}>
                Use {suggestedFormat} (MC {currentVersion})
              </button>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
            {MC_VERSIONS.find(v => (isResourcepack ? v.resourcepack : v.datapack) === pack.pack_format)?.label
              ? `Compatible with MC ${MC_VERSIONS.find(v => (isResourcepack ? v.resourcepack : v.datapack) === pack.pack_format)?.label}`
              : `Pack format ${pack.pack_format}`}
          </p>
        </div>

        {/* Description */}
        <div>
          <p className="label">Description</p>
          <input
            className="input text-sm"
            value={typeof pack.description === 'string' ? pack.description : JSON.stringify(pack.description || '')}
            onChange={e => setPack({ description: e.target.value })}
            placeholder="example"
          />
          {/* Preview */}
          <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Preview:</p>
            <TellrawInline text={pack.description || ''} />
          </div>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
            Use §c for red, §a for green, §b for aqua, §e for yellow, §f for white
          </p>
        </div>

        {/* Supported formats (1.20.2+) */}
        <div>
          <p className="label">Supported Formats <span style={{ color: '#334155', fontWeight: 400 }}>(optional, 1.20.2+)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Min inclusive</p>
              <input
                type="number"
                className="input text-sm"
                value={meta.pack?.supported_formats?.min_inclusive ?? ''}
                onChange={e => setPack({
                  supported_formats: {
                    min_inclusive: parseInt(e.target.value) || undefined,
                    max_inclusive: pack.supported_formats?.max_inclusive,
                  },
                })}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Max inclusive</p>
              <input
                type="number"
                className="input text-sm"
                value={meta.pack?.supported_formats?.max_inclusive ?? ''}
                onChange={e => setPack({
                  supported_formats: {
                    min_inclusive: pack.supported_formats?.min_inclusive,
                    max_inclusive: parseInt(e.target.value) || undefined,
                  },
                })}
                placeholder="e.g. 61"
              />
            </div>
          </div>
        </div>

        {/* Filter (resourcepack) */}
        {isResourcepack && (
          <div>
            <p className="label">Filter <span style={{ color: '#334155', fontWeight: 400 }}>(optional)</span></p>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>
              Block specific namespaces from this resource pack. Used for overriding built-in resources.
            </p>
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder='{"namespace": "minecraft", "path": "..."}'
                onChange={e => {
                  try {
                    const filter = JSON.parse(e.target.value)
                    save({ ...meta, filter: { block: [filter] } })
                  } catch {}
                }}
              />
            </div>
          </div>
        )}

        {/* Raw JSON preview */}
        <div>
          <p className="label">Raw JSON</p>
          <textarea
            className="input font-mono text-xs resize-none"
            rows={8}
            value={JSON.stringify(meta, null, 2)}
            onChange={e => { try { setMeta(JSON.parse(e.target.value)); updateFile(path, e.target.value) } catch {} }}
          />
        </div>

        <button className="btn btn-primary self-start" onClick={() => saveFile(path)}>
          Save pack.mcmeta
        </button>
      </div>
    </div>
  )
}
