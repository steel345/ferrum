import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { MC_ITEMS } from '../../data/minecraftData'
import { Plus, Trash2, ChevronDown, ChevronRight, Code, Eye } from 'lucide-react'

const LOOT_TABLE_TYPES = [
  'minecraft:chest','minecraft:entity','minecraft:block','minecraft:fishing',
  'minecraft:gift','minecraft:advancement_reward','minecraft:barter','minecraft:empty',
]

const ENTRY_TYPES = [
  'minecraft:item','minecraft:tag','minecraft:loot_table',
  'minecraft:group','minecraft:alternatives','minecraft:sequence',
  'minecraft:dynamic','minecraft:empty',
]

function ItemSelect({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const found = MC_ITEMS.find(i => i.id === value)
  const filtered = MC_ITEMS.filter(i =>
    !search || i.id.includes(search.toLowerCase()) || i.label.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 40)

  return (
    <div className="relative">
      <button
        className="input text-xs py-1 flex items-center gap-1.5 w-full text-left"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {found ? <><span>{found.emoji}</span><span className="truncate">{found.id}</span></> : <span style={{ color: '#334155' }}>None</span>}
        <ChevronDown size={10} className="ml-auto shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg overflow-hidden shadow-xl w-64"
          style={{ background: '#0b1525', border: '1px solid #1a3050' }}>
          <div className="p-2">
            <input autoFocus className="input text-xs py-1" placeholder="Search items..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-y-auto max-h-48">
            <div className="p-1 cursor-pointer hover:bg-mc-hover text-xs py-1.5 px-3" style={{ color: '#64748b' }}
              onClick={() => { onChange(null); setOpen(false) }}>
              None / Clear
            </div>
            {filtered.map(item => (
              <div key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:bg-white/5"
                style={{ color: '#e2e8f0' }}
                onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}>
                <span>{item.emoji}</span>
                <span className="truncate">{item.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EntryEditor({ entry, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(true)

  function setField(key, value) {
    onChange({ ...entry, [key]: value })
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1a3050', background: '#0a1220' }}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        style={{ background: '#0d1829' }}
        onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>{entry.type}</span>
        {entry.name && <span className="text-xs" style={{ color: '#64748b' }}>→ {entry.name}</span>}
        {entry.weight && <span className="text-xs ml-auto" style={{ color: '#fbbf24' }}>w:{entry.weight}</span>}
        <button className="ml-1 p-0.5 rounded hover:text-red-400" style={{ color: '#64748b' }}
          onClick={e => { e.stopPropagation(); onDelete() }}>
          <Trash2 size={11} />
        </button>
      </div>

      {expanded && (
        <div className="p-3 flex flex-col gap-3">
          {/* Entry type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label">Entry Type</p>
              <select className="select text-xs w-full" value={entry.type || ''}
                onChange={e => setField('type', e.target.value)}>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="label">Weight</p>
              <input type="number" min="1" className="input text-xs"
                value={entry.weight ?? 1}
                onChange={e => setField('weight', parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {/* Item name for item type */}
          {entry.type === 'minecraft:item' && (
            <div>
              <p className="label">Item</p>
              <ItemSelect value={entry.name} onChange={v => setField('name', v)} />
            </div>
          )}

          {/* Functions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label mb-0">Item Functions</p>
              <button className="btn btn-ghost text-xs py-0.5 px-2"
                onClick={() => setField('functions', [
                  ...(entry.functions || []),
                  { function: 'minecraft:set_count', count: { min: 1, max: 1 } }
                ])}>
                <Plus size={10} /> Add
              </button>
            </div>
            {(entry.functions || []).map((fn, fi) => (
              <div key={fi} className="flex items-center gap-2 mb-1.5 rounded p-2" style={{ background: '#060c18' }}>
                <select className="select text-xs flex-1" value={fn.function || ''}
                  onChange={e => {
                    const fns = [...(entry.functions || [])]
                    fns[fi] = { ...fns[fi], function: e.target.value }
                    setField('functions', fns)
                  }}>
                  {['minecraft:set_count','minecraft:enchant_with_levels','minecraft:looting_enchant',
                    'minecraft:set_damage','minecraft:set_name','minecraft:set_lore',
                    'minecraft:furnace_smelt','minecraft:exploration_map',
                    'minecraft:fill_player_head','minecraft:copy_name','minecraft:set_nbt'].map(f =>
                    <option key={f} value={f}>{f.replace('minecraft:','')}</option>
                  )}
                </select>
                {(fn.function === 'minecraft:set_count' || fn.function === 'minecraft:looting_enchant') && (
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="number" placeholder="min" className="input text-xs py-0.5 px-1 w-12"
                      value={fn.count?.min ?? fn.count ?? 1}
                      onChange={e => {
                        const fns = [...(entry.functions || [])]
                        fns[fi] = { ...fns[fi], count: { min: parseInt(e.target.value)||1, max: fn.count?.max ?? fn.count ?? 1 } }
                        setField('functions', fns)
                      }} />
                    <span className="text-xs" style={{ color: '#64748b' }}>-</span>
                    <input type="number" placeholder="max" className="input text-xs py-0.5 px-1 w-12"
                      value={fn.count?.max ?? fn.count ?? 1}
                      onChange={e => {
                        const fns = [...(entry.functions || [])]
                        fns[fi] = { ...fns[fi], count: { min: fn.count?.min ?? fn.count ?? 1, max: parseInt(e.target.value)||1 } }
                        setField('functions', fns)
                      }} />
                  </div>
                )}
                <button className="btn btn-ghost p-0.5" style={{ color: '#64748b' }}
                  onClick={() => setField('functions', entry.functions.filter((_, i) => i !== fi))}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PoolEditor({ pool, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(true)

  function setField(k, v) { onChange({ ...pool, [k]: v }) }

  function addEntry() {
    setField('entries', [...(pool.entries || []), { type: 'minecraft:item', name: 'minecraft:stone', weight: 1 }])
  }

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid #1e3a5f', background: '#0b1525' }}>
      {/* Pool header */}
      <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer"
        style={{ background: '#0d1829', borderBottom: '1px solid #1a3050' }}
        onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Pool</span>
        <span className="text-xs ml-2" style={{ color: '#64748b' }}>
          {pool.entries?.length || 0} entries
        </span>
        <div className="flex-1" />
        <button className="btn btn-ghost p-1 hover:text-red-400" style={{ color: '#64748b' }}
          onClick={e => { e.stopPropagation(); onDelete() }}>
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div className="p-4 flex flex-col gap-4">
          {/* Rolls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label">Min Rolls</p>
              <input type="number" min="0" className="input text-xs"
                value={pool.rolls?.min ?? pool.rolls ?? 1}
                onChange={e => setField('rolls', {
                  min: parseInt(e.target.value) || 0,
                  max: pool.rolls?.max ?? pool.rolls ?? 1,
                })} />
            </div>
            <div>
              <p className="label">Max Rolls</p>
              <input type="number" min="0" className="input text-xs"
                value={pool.rolls?.max ?? pool.rolls ?? 1}
                onChange={e => setField('rolls', {
                  min: pool.rolls?.min ?? pool.rolls ?? 1,
                  max: parseInt(e.target.value) || 1,
                })} />
            </div>
          </div>

          {/* Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label mb-0">Entries</p>
              <button className="btn btn-secondary text-xs py-1 px-2" onClick={addEntry}>
                <Plus size={11} className="inline mr-1" /> Add Entry
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(pool.entries || []).map((entry, ei) => (
                <EntryEditor
                  key={ei}
                  entry={entry}
                  onChange={updated => {
                    const entries = [...pool.entries]
                    entries[ei] = updated
                    setField('entries', entries)
                  }}
                  onDelete={() => setField('entries', pool.entries.filter((_, i) => i !== ei))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LootTableEditor({ path }) {
  const { files, updateFile, saveFile } = useStore()
  const [table, setTable] = useState(null)
  const [viewMode, setViewMode] = useState('visual')

  useEffect(() => {
    try { setTable(JSON.parse(files[path] || '{}')) }
    catch { setTable(null) }
  }, [path, files[path]])

  function save(t) {
    setTable(t)
    updateFile(path, JSON.stringify(t, null, 2))
  }

  if (!table) return (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: '#64748b' }}>
      Loading or invalid JSON…
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#060c18' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1a3050', background: '#040810' }}>
        <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Loot Table</span>
        <select className="select text-xs py-1" value={table.type || ''} onChange={e => save({ ...table, type: e.target.value })}>
          {LOOT_TABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid #1a3050' }}>
          <button className={`px-3 py-1 text-xs ${viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-mc-muted'}`} onClick={() => setViewMode('visual')}>
            <Eye size={12} className="inline mr-1" />Visual
          </button>
          <button className={`px-3 py-1 text-xs ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-mc-muted'}`} onClick={() => setViewMode('json')}>
            <Code size={12} className="inline mr-1" />JSON
          </button>
        </div>
        <button className="btn btn-primary text-xs px-3 py-1" onClick={() => saveFile(path)}>Save</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'json' ? (
          <textarea
            className="input font-mono text-xs w-full h-full resize-none min-h-96"
            value={JSON.stringify(table, null, 2)}
            onChange={e => { try { setTable(JSON.parse(e.target.value)); updateFile(path, e.target.value) } catch {} }}
          />
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                🎲 {table.pools?.length || 0} pool{table.pools?.length !== 1 ? 's' : ''}
              </h2>
              <button className="btn btn-primary text-xs px-3 py-1.5"
                onClick={() => save({ ...table, pools: [...(table.pools || []), {
                  rolls: { min: 1, max: 3 },
                  entries: [{ type: 'minecraft:item', name: 'minecraft:stone', weight: 1 }],
                }]})}>
                <Plus size={12} className="inline mr-1" />Add Pool
              </button>
            </div>
            {(table.pools || []).map((pool, pi) => (
              <PoolEditor
                key={pi}
                pool={pool}
                onChange={updated => {
                  const pools = [...table.pools]
                  pools[pi] = updated
                  save({ ...table, pools })
                }}
                onDelete={() => save({ ...table, pools: table.pools.filter((_, i) => i !== pi) })}
              />
            ))}
            {(!table.pools || !table.pools.length) && (
              <div className="text-center py-12 text-sm" style={{ color: '#334155' }}>
                No pools yet — click "Add Pool" to start
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
