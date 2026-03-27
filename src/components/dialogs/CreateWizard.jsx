import React, { useState, useCallback } from 'react'
import useStore from '../../store/useStore'
import { MC_ITEMS } from '../../data/minecraftData'
import McTexture from '../McTexture'

// ── Field components defined OUTSIDE to prevent remount on re-render ──────────
function Field({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: '#93c5fd', fontSize: 11, display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        className="input text-xs py-1.5"
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      {hint && <p style={{ color: '#334155', fontSize: 10, marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: '#93c5fd', fontSize: 11, display: 'block', marginBottom: 4 }}>{label}</label>
      <select className="select text-xs w-full" value={value || options[0].value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Visual Crafting Grid ───────────────────────────────────────────────────────
function CraftingGrid({ slots, onSlotClick, result, onResultClick, type }) {
  const size = (type === 'smelting' || type === 'smoking' || type === 'blasting') ? 1 : 9

  function SlotBtn({ index, item, onClick, big }) {
    const label = item ? item.replace('minecraft:', '') : ''
    return (
      <button onClick={() => onClick(index)}
        title={item || 'Click to set item'}
        style={{
          width: big ? 56 : 44, height: big ? 56 : 44,
          border: item ? '2px solid #4b5563' : '2px dashed #1e3050',
          background: item ? '#1f2937' : '#0b1525',
          borderRadius: 4, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 2,
          fontSize: 9, color: '#9ca3af',
          transition: 'all 0.1s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = item ? '#4b5563' : '#1e3050' }}
      >
        {item ? (
          <>
            <McTexture item={MC_ITEMS.find(i => i.id === item)} size={big ? 32 : 24} />
            <span style={{ fontSize: 8, color: '#6b7280', maxWidth: big ? 50 : 40,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </>
        ) : (
          <span style={{ color: '#1e3050', fontSize: 18 }}>+</span>
        )}
      </button>
    )
  }

  if (type === 'smelting' || type === 'smoking' || type === 'blasting') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Input</div>
          <SlotBtn index={0} item={slots[0]} onClick={onSlotClick} />
        </div>
        <div style={{ fontSize: 28, color: '#f97316' }}>🔥</div>
        <div>
          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Result</div>
          <SlotBtn index={0} item={result} onClick={onResultClick} big />
        </div>
      </div>
    )
  }

  if (type === 'shapeless') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Ingredients (up to 9)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 3 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <SlotBtn key={i} index={i} item={slots[i]} onClick={onSlotClick} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 22 }}>→</div>
        <div>
          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Result</div>
          <SlotBtn index={0} item={result} onClick={onResultClick} big />
        </div>
      </div>
    )
  }

  // Shaped 3x3
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Crafting Grid</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 3 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <SlotBtn key={i} index={i} item={slots[i]} onClick={onSlotClick} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 22 }}>→</div>
      <div>
        <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Result</div>
        <SlotBtn index={0} item={result} onClick={onResultClick} big />
      </div>
    </div>
  )
}

// ── Item picker popup ─────────────────────────────────────────────────────────
function ItemPicker({ onPick, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = MC_ITEMS.filter(i =>
    !search || i.id.includes(search.toLowerCase()) || i.label.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 80)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#07111f', border: '1px solid #1a3050', borderRadius: 12,
        padding: 20, width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 40px rgba(37,99,235,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Pick Item</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <input
          autoFocus
          className="input text-xs py-1.5 mb-3"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {/* Clear slot option */}
            <button onClick={() => onPick(null)}
              style={{ padding: 6, border: '1px dashed #1e3050', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: '#64748b', fontSize: 10 }}>
              Clear
            </button>
            {filtered.map(item => (
              <button key={item.id} onClick={() => onPick(item.id)} title={item.id}
                style={{ padding: 6, border: '1px solid #1a3050', borderRadius: 6, cursor: 'pointer',
                  background: '#0b1525', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 2, transition: 'all 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#0f1e35' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.background = '#0b1525' }}>
                <McTexture item={item} size={24} />
                <span style={{ fontSize: 8, color: '#64748b', textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── JSON generators ───────────────────────────────────────────────────────────
function buildRecipeJson(type, slots, result, resultCount) {
  if (!result) return null
  const res = { item: result, count: parseInt(resultCount) || 1 }

  if (type === 'smelting' || type === 'smoking' || type === 'blasting') {
    return {
      type: `minecraft:${type}`,
      ingredient: slots[0] ? { item: slots[0] } : { item: 'minecraft:iron_ore' },
      result,   // smelting uses a plain string, not an object
      experience: 0.7,
      cookingtime: type === 'smelting' ? 200 : 100,
    }
  }

  if (type === 'shapeless') {
    const ing = slots.filter(Boolean).map(id => ({ item: id }))
    if (!ing.length) return null
    return { type: 'minecraft:crafting_shapeless', ingredients: ing, result: res }
  }

  // Shaped — build minimal pattern
  const grid = [
    [slots[0], slots[1], slots[2]],
    [slots[3], slots[4], slots[5]],
    [slots[6], slots[7], slots[8]],
  ]
  const key = {}
  let charCode = 65 // A
  const charMap = {}
  for (const row of grid) {
    for (const item of row) {
      if (item && !charMap[item]) {
        const ch = String.fromCharCode(charCode++)
        charMap[item] = ch
        key[ch] = { item }
      }
    }
  }
  const pattern = grid.map(row =>
    row.map(item => (item ? charMap[item] : ' ')).join('')
  )
  // Trim empty rows
  while (pattern.length > 0 && pattern[pattern.length - 1].trim() === '') pattern.pop()
  if (!pattern.length || Object.keys(key).length === 0) return null
  return { type: 'minecraft:crafting_shaped', pattern, key, result: res }
}

function makeFunction(name, template) {
  const map = {
    blank:   `# ${name}\n# Created with Ferrum\n\n`,
    give:    `# Give item to player\ngive @s minecraft:diamond 1\n`,
    effect:  `effect give @s minecraft:speed 30 1\n`,
    message: `tellraw @a {"text":"Hello from ${name}!","color":"gold"}\n`,
    loop:    `# Called every tick\n`,
    tp:      `tp @s ~ ~1 ~\n`,
  }
  return map[template] || map.blank
}

function makeAdvancement(ns, name, title, desc, trigger, icon, frame) {
  return JSON.stringify({
    display: {
      icon: { item: icon?.includes(':') ? icon : `minecraft:${icon || 'diamond'}` },
      title: { text: title || name },
      description: { text: desc || '' },
      frame: frame || 'task',
      show_toast: true,
      announce_to_chat: true,
    },
    criteria: { [`${name}_trigger`]: { trigger: trigger || 'minecraft:impossible' } },
  }, null, 2)
}

function makeLootTable(lootType, entries) {
  return JSON.stringify({
    type: `minecraft:${lootType || 'chest'}`,
    pools: [{
      rolls: { min: 1, max: 3 },
      entries: entries.filter(Boolean).map(id => ({
        type: 'minecraft:item',
        name: id.includes(':') ? id : `minecraft:${id}`,
        weight: 1,
      })),
    }],
  }, null, 2)
}

function makeTag(tagType, values) {
  return JSON.stringify({
    replace: false,
    values: values.filter(Boolean).map(v => v.includes(':') ? v : `minecraft:${v}`),
  }, null, 2)
}

function makeBlockModel(ns, name, parentModel, texturePath, isBlock) {
  return JSON.stringify(isBlock
    ? { parent: parentModel || 'minecraft:block/cube_all', textures: { all: texturePath || `${ns}:block/${name}` } }
    : { parent: parentModel || 'minecraft:item/generated', textures: { layer0: texturePath || `${ns}:item/${name}` } }
  , null, 2)
}

// ── Wizard types ──────────────────────────────────────────────────────────────
const TYPES = [
  { id: 'recipe',      label: 'Recipe',          icon: '🔨', desc: 'Crafting, smelting, smoking…' },
  { id: 'function',    label: 'Function',         icon: '⚙️', desc: '.mcfunction command file' },
  { id: 'advancement', label: 'Advancement',      icon: '🏆', desc: 'Achievement toast' },
  { id: 'loot_table',  label: 'Loot Table',       icon: '🎲', desc: 'Drops for chests, mobs, blocks' },
  { id: 'tag',         label: 'Tag',              icon: '🏷️', desc: 'Group items, blocks or entities' },
  { id: 'block',       label: 'Block/Item Model', icon: '🧱', desc: 'JSON model for custom block/item' },
]

// ── In-game recipe preview ────────────────────────────────────────────────────
function RecipePreview({ recipeType, slots, result, resultCount }) {
  const isSmelting = recipeType === 'smelting' || recipeType === 'smoking' || recipeType === 'blasting'
  function ItemSlot({ item, big, label }) {
    const mc = MC_ITEMS.find(i => i.id === item)
    return (
      <div style={{
        width: big ? 56 : 40, height: big ? 56 : 40,
        background: item ? '#8b8b8b' : '#6b6b6b',
        border: '3px solid', borderColor: item ? '#fff #373737 #373737 #fff' : '#555 #888 #888 #555',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', position: 'relative', flexShrink: 0,
      }}>
        {item ? (
          <>
            <McTexture item={mc} size={big ? 36 : 28} />
            {big && resultCount > 1 && (
              <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 9,
                color: '#fff', fontWeight: 700, textShadow: '1px 1px 0 #000' }}>{resultCount}</span>
            )}
          </>
        ) : null}
      </div>
    )
  }

  if (isSmelting) {
    const furnaceColors = { smelting: '#c87137', smoking: '#5a8c3c', blasting: '#888888' }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#aaa', fontSize: 10, marginBottom: 4 }}>
          {recipeType.charAt(0).toUpperCase() + recipeType.slice(1)} Recipe Preview
        </div>
        <div style={{ background: '#3c3c3c', border: '3px solid #555', borderRadius: 4, padding: 16,
          display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ItemSlot item={slots[0]} />
            <div style={{ width: 40, height: 20, background: furnaceColors[recipeType] || '#c87137',
              border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12 }}>🔥</div>
          </div>
          <div style={{ color: '#ccc', fontSize: 20 }}>→</div>
          <ItemSlot item={result} big />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ color: '#aaa', fontSize: 10, marginBottom: 4 }}>Crafting Table Preview</div>
      <div style={{ background: '#c6a876', border: '3px solid #8b7355', borderRadius: 4, padding: 12,
        display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Crafting grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 3,
          background: '#8b7355' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <ItemSlot key={i} item={slots[i]} />
          ))}
        </div>
        <div style={{ color: '#5a3e1b', fontSize: 24 }}>→</div>
        <ItemSlot item={result} big resultCount={parseInt(resultCount) || 1} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CreateWizard({ onClose }) {
  const { project, createFile, showToast } = useStore()
  const [step, setStep]   = useState('pick')
  const [type, setType]   = useState(null)

  // Generic form state
  const [name, setName]       = useState('')
  const [template, setTemplate] = useState('blank')
  const [recipeType, setRecipeType] = useState('shaped')
  const [slots, setSlots]     = useState(Array(9).fill(null))
  const [result, setResult]   = useState(null)
  const [resultCount, setResultCount] = useState('1')
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [icon, setIcon]       = useState('diamond')
  const [frame, setFrame]     = useState('task')
  const [trigger, setTrigger] = useState('minecraft:impossible')
  const [lootType, setLootType] = useState('chest')
  const [entries, setEntries] = useState('')
  const [tagType, setTagType] = useState('items')
  const [values, setValues]   = useState('')
  const [modelType, setModelType] = useState('block')
  const [parent, setParent]   = useState('')
  const [texture, setTexture] = useState('')

  // Result step state
  const [generatedPath, setGeneratedPath] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Item picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null)

  const ns  = project?.namespace || 'my_namespace'
  const dp  = project?.datpackRoot || ns + '_datapack'
  const rp  = project?.resourcepackRoot || ns + '_resourcepack'
  const base = `${dp}/data/${ns}`

  function openSlotPicker(index) {
    setPickerTarget({ kind: 'slot', index })
    setPickerOpen(true)
  }
  function openResultPicker() {
    setPickerTarget({ kind: 'result' })
    setPickerOpen(true)
  }
  function handlePick(itemId) {
    if (pickerTarget?.kind === 'slot') {
      const next = [...slots]
      next[pickerTarget.index] = itemId
      setSlots(next)
    } else if (pickerTarget?.kind === 'result') {
      setResult(itemId)
    }
    setPickerOpen(false)
  }

  function generate() {
    const safeName = (name || 'unnamed').replace(/\s+/g, '_').toLowerCase()
    let filePath = '', content = ''

    if (type === 'recipe') {
      const data = buildRecipeJson(recipeType, slots, result, resultCount)
      if (!data) { showToast('Fill in at least one ingredient and a result', 'error'); return }
      filePath = `${base}/recipes/${safeName}.json`
      content = JSON.stringify(data, null, 2)
    } else if (type === 'function') {
      filePath = `${base}/functions/${safeName}.mcfunction`
      content = makeFunction(safeName, template)
    } else if (type === 'advancement') {
      filePath = `${base}/advancements/${safeName}.json`
      content = makeAdvancement(ns, safeName, title, desc, trigger, icon, frame)
    } else if (type === 'loot_table') {
      filePath = `${base}/loot_tables/${safeName}.json`
      content = makeLootTable(lootType, entries.split(',').map(s => s.trim()))
    } else if (type === 'tag') {
      filePath = `${base}/tags/${tagType}/${safeName}.json`
      content = makeTag(tagType, values.split(',').map(s => s.trim()))
    } else if (type === 'block') {
      const isBlock = modelType === 'block'
      filePath = isBlock
        ? `${rp}/assets/${ns}/models/block/${safeName}.json`
        : `${rp}/assets/${ns}/models/item/${safeName}.json`
      content = makeBlockModel(ns, safeName, parent, texture, isBlock)
    }

    if (!filePath) return
    setGeneratedPath(filePath)
    setGeneratedContent(content)
    setShowPreview(false)
    setStep('result')
  }

  function saveToProject() {
    createFile(generatedPath, generatedContent)
    showToast(`Created ${generatedPath.split('/').pop()}`, 'success')
    onClose()
  }

  const canCreate = name.trim().length > 0
  const canPreview = type === 'recipe'

  // ── Step: pick type ──────────────────────────────────────────────────────
  if (step === 'pick') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#07111f', border: '1px solid #1a3050', borderRadius: 14,
        padding: 28, width: 520, maxWidth: '95vw', boxShadow: '0 0 60px rgba(37,99,235,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>Create New…</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TYPES.map(t => (
            <button key={t.id}
              onClick={() => { setType(t.id); setName(''); setStep('form') }}
              style={{ background: '#0b1525', border: '1px solid #1a3050', borderRadius: 10,
                padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#0f1e35' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.background = '#0b1525' }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{t.label}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Step: result (show code + preview) ──────────────────────────────────
  if (step === 'result') {
    const fileName = generatedPath.split('/').pop()
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#07111f', border: '1px solid #1a3050', borderRadius: 14,
          padding: 28, width: 560, maxWidth: '95vw', maxHeight: '90vh', display: 'flex',
          flexDirection: 'column', boxShadow: '0 0 60px rgba(37,99,235,0.15)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setStep('form')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>←</button>
            <span style={{ fontSize: 20 }}>{TYPES.find(t => t.id === type)?.icon}</span>
            <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, margin: 0 }}>{fileName}</h2>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>

          {/* Toggle tabs */}
          <div style={{ display: 'flex', marginBottom: 12, background: '#0b1525',
            borderRadius: 8, padding: 3, border: '1px solid #1a3050' }}>
            <button onClick={() => setShowPreview(false)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', background: !showPreview ? '#2563eb' : 'transparent',
                color: !showPreview ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
              {'{ }'} Code
            </button>
            {canPreview && (
              <button onClick={() => setShowPreview(true)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', background: showPreview ? '#2563eb' : 'transparent',
                  color: showPreview ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
                🎮 Preview
              </button>
            )}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {!showPreview ? (
              <pre style={{ margin: 0, background: '#030c18', border: '1px solid #1a3050', borderRadius: 8,
                padding: 16, color: '#93c5fd', fontSize: 12, fontFamily: 'monospace',
                overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {generatedContent}
              </pre>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 200, background: '#030c18', border: '1px solid #1a3050', borderRadius: 8, padding: 24 }}>
                <RecipePreview recipeType={recipeType} slots={slots} result={result} resultCount={resultCount} />
              </div>
            )}
          </div>

          {/* Path hint */}
          <p style={{ color: '#334155', fontSize: 10, margin: '8px 0 12px', fontFamily: 'monospace' }}>
            {generatedPath}
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('form')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: 'transparent',
                border: '1px solid #1a3050', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3050'}>
              ← Edit
            </button>
            <button onClick={saveToProject}
              style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              💾 Save to Project
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: form ───────────────────────────────────────────────────────────
  const T = TYPES.find(t => t.id === type)
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#07111f', border: '1px solid #1a3050', borderRadius: 14,
          padding: 28, width: 520, maxWidth: '95vw', boxShadow: '0 0 60px rgba(37,99,235,0.15)',
          maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setStep('pick')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>←</button>
            <span style={{ fontSize: 20 }}>{T?.icon}</span>
            <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, margin: 0 }}>New {T?.label}</h2>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>

          {/* Name — always shown */}
          <Field label="Name (filename)" value={name} onChange={setName}
            placeholder={type === 'function' ? 'my_function' : type === 'recipe' ? 'my_recipe' : 'my_' + type} />

          {/* Recipe — visual grid */}
          {type === 'recipe' && (
            <>
              <Sel label="Recipe type" value={recipeType} onChange={setRecipeType} options={[
                { value: 'shaped',    label: 'Shaped (3×3 crafting grid)' },
                { value: 'shapeless', label: 'Shapeless' },
                { value: 'smelting',  label: 'Smelting (Furnace)' },
                { value: 'smoking',   label: 'Smoking (Smoker)' },
                { value: 'blasting',  label: 'Blasting (Blast Furnace)' },
              ]} />
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#93c5fd', fontSize: 11, display: 'block', marginBottom: 8 }}>
                  Recipe Grid — click slots to set items
                </label>
                <CraftingGrid
                  slots={slots}
                  onSlotClick={openSlotPicker}
                  result={result}
                  onResultClick={openResultPicker}
                  type={recipeType}
                />
              </div>
              <Field label="Result count" value={resultCount} onChange={setResultCount} placeholder="1" />
            </>
          )}

          {/* Function */}
          {type === 'function' && (
            <Sel label="Starting template" value={template} onChange={setTemplate} options={[
              { value: 'blank',   label: 'Blank' },
              { value: 'give',    label: 'Give item to player' },
              { value: 'effect',  label: 'Apply potion effect' },
              { value: 'message', label: 'Send chat message' },
              { value: 'loop',    label: 'Tick loop (empty)' },
              { value: 'tp',      label: 'Teleport player' },
            ]} />
          )}

          {/* Advancement */}
          {type === 'advancement' && (
            <>
              <Field label="Title" value={title} onChange={setTitle} placeholder="My Advancement" />
              <Field label="Description" value={desc} onChange={setDesc} placeholder="Do something cool" />
              <Field label="Icon item" value={icon} onChange={setIcon} placeholder="diamond" />
              <Sel label="Frame" value={frame} onChange={setFrame} options={[
                { value: 'task',      label: 'Task (rectangle)' },
                { value: 'goal',      label: 'Goal (rounded)' },
                { value: 'challenge', label: 'Challenge (spiky)' },
              ]} />
              <Field label="Trigger" value={trigger} onChange={setTrigger}
                placeholder="minecraft:impossible"
                hint="e.g. minecraft:inventory_changed, minecraft:location" />
            </>
          )}

          {/* Loot table */}
          {type === 'loot_table' && (
            <>
              <Sel label="Type" value={lootType} onChange={setLootType} options={[
                { value: 'chest',   label: 'Chest' },
                { value: 'entity',  label: 'Entity (mob drops)' },
                { value: 'block',   label: 'Block' },
                { value: 'fishing', label: 'Fishing' },
              ]} />
              <Field label="Items (comma-separated)" value={entries} onChange={setEntries}
                placeholder="diamond, iron_ingot, gold_ingot"
                hint="Comma-separated. minecraft: prefix optional." />
            </>
          )}

          {/* Tag */}
          {type === 'tag' && (
            <>
              <Sel label="Tag type" value={tagType} onChange={setTagType} options={[
                { value: 'items',        label: 'Items' },
                { value: 'blocks',       label: 'Blocks' },
                { value: 'entity_types', label: 'Entity Types' },
                { value: 'functions',    label: 'Functions' },
              ]} />
              <Field label="Values (comma-separated)" value={values} onChange={setValues}
                placeholder="diamond, iron_ingot, gold_ingot" />
            </>
          )}

          {/* Block/Item model */}
          {type === 'block' && (
            <>
              <Sel label="Model type" value={modelType} onChange={setModelType} options={[
                { value: 'block', label: 'Block model' },
                { value: 'item',  label: 'Item model' },
              ]} />
              <Field label="Parent model" value={parent} onChange={setParent}
                placeholder="minecraft:block/cube_all"
                hint="Block: cube_all, cross · Item: item/generated, item/handheld" />
              <Field label="Texture path" value={texture} onChange={setTexture}
                placeholder={`${ns}:block/my_block`} />
            </>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: 'transparent',
                border: '1px solid #1a3050', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3050'}>
              Cancel
            </button>
            <button onClick={generate} disabled={!canCreate}
              style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                background: canCreate ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1a3050',
                color: canCreate ? '#fff' : '#334155', fontSize: 13, fontWeight: 700,
                cursor: canCreate ? 'pointer' : 'not-allowed' }}>
              ✦ Create {T?.label}
            </button>
          </div>

          {name && (
            <p style={{ color: '#1e3050', fontSize: 10, marginTop: 8, fontFamily: 'monospace', textAlign: 'center' }}>
              → {name.replace(/\s+/g, '_').toLowerCase()}{type === 'function' ? '.mcfunction' : '.json'}
            </p>
          )}
        </div>
      </div>

      {pickerOpen && <ItemPicker onPick={handlePick} onClose={() => setPickerOpen(false)} />}
    </>
  )
}
