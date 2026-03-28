import React, { useMemo, useState, useCallback } from 'react'
import useStore from '../../store/useStore'

// ── Minecraft chat colors ─────────────────────────────────────────────────────
const MC_COLORS = {
  black:'#000',dark_blue:'#00A',dark_green:'#0A0',dark_aqua:'#0AA',
  dark_red:'#A00',dark_purple:'#A0A',gold:'#FA0',gray:'#AAA',
  dark_gray:'#555',blue:'#55F',green:'#5F5',aqua:'#5FF',
  red:'#F55',light_purple:'#F5F',yellow:'#FF5',white:'#FFF',
}
function renderTellraw(comp, key=0) {
  if (typeof comp === 'string') return <span key={key}>{comp}</span>
  if (Array.isArray(comp)) return <>{comp.map((c,i) => renderTellraw(c,i))}</>
  const style = {
    color: MC_COLORS[comp.color] || comp.color || '#FFF',
    fontWeight: comp.bold ? 'bold' : undefined,
    fontStyle: comp.italic ? 'italic' : undefined,
    textDecoration: [comp.underlined&&'underline',comp.strikethrough&&'line-through'].filter(Boolean).join(' ')||undefined,
  }
  return <span key={key} style={style}>{comp.text||''}{(comp.extra||[]).map((e,i)=>renderTellraw(e,`${key}-${i}`))}</span>
}

// ── Recipe Preview ─────────────────────────────────────────────────────────────
function RecipePreview({ data }) {
  const isShaped     = data.type?.includes('shaped') && !data.type?.includes('shapeless')
  const isShapeless  = data.type?.includes('shapeless')
  const isSmelting   = data.type?.includes('smelting') || data.type?.includes('smoking') || data.type?.includes('blasting')

  const resultItem = data.result?.item || data.result?.id || (typeof data.result === 'string' ? data.result : '')
  const resultCount = data.result?.count || 1

  function itemLabel(itemObj) {
    if (!itemObj) return ''
    if (typeof itemObj === 'string') return itemObj.replace('minecraft:','')
    if (itemObj.item) return itemObj.item.replace('minecraft:','')
    if (itemObj.tag)  return `#${itemObj.tag.replace('minecraft:','')}`
    if (Array.isArray(itemObj)) return itemObj[0]?.item?.replace('minecraft:','') || '?'
    return ''
  }

  function slotBg(filled) {
    return { width:44, height:44, border: filled ? '2px solid #6b7280' : '2px solid #374151',
      background: filled ? '#1f2937' : '#111827', borderRadius:4, display:'flex',
      alignItems:'center', justifyContent:'center', fontSize:9, color:'#9ca3af',
      textAlign:'center', lineHeight:1.2, wordBreak:'break-all', padding:2, cursor:'default' }
  }

  if (isShaped && data.pattern && data.key) {
    const rows = data.pattern.map(row => row.split(''))
    while (rows.length < 3) rows.push(['','',''])
    const grid = rows.map(row => { while(row.length<3) row.push(''); return row })
    return (
      <div style={{ fontFamily:'monospace' }}>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          Shaped Recipe — {data.type?.split(':')[1] || 'crafting_shaped'}
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,44px)', gap:3 }}>
            {grid.map((row,r) => row.map((ch,c) => {
              const ingredient = ch && ch !== ' ' ? data.key[ch] : null
              const label = itemLabel(ingredient)
              return <div key={`${r}-${c}`} style={slotBg(!!label)}>{label}</div>
            }))}
          </div>
          <div style={{ fontSize:22 }}>→</div>
          <div>
            <div style={slotBg(true)}>{resultItem.replace('minecraft:','')}</div>
            {resultCount > 1 && <div style={{ color:'#fbbf24', fontSize:10, textAlign:'center', marginTop:2 }}>×{resultCount}</div>}
          </div>
        </div>
      </div>
    )
  }

  if (isShapeless && data.ingredients) {
    const ing = data.ingredients.slice(0,9)
    return (
      <div>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          Shapeless Recipe
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,44px)', gap:3 }}>
            {Array.from({length:9}).map((_,i) => {
              const label = i < ing.length ? itemLabel(ing[i]) : ''
              return <div key={i} style={slotBg(!!label)}>{label}</div>
            })}
          </div>
          <div style={{ fontSize:22 }}>→</div>
          <div>
            <div style={slotBg(true)}>{resultItem.replace('minecraft:','')}</div>
            {resultCount>1 && <div style={{ color:'#fbbf24', fontSize:10, textAlign:'center', marginTop:2 }}>×{resultCount}</div>}
          </div>
        </div>
      </div>
    )
  }

  if (isSmelting) {
    const ingredient = data.ingredient ? itemLabel(data.ingredient) : '?'
    const exp = data.experience || 0
    const time = data.cookingtime || 200
    return (
      <div>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          {data.type?.split(':')[1]?.replace(/_/g,' ') || 'Smelting'}
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={slotBg(true)}>{ingredient}</div>
          <div style={{ fontSize:22 }}>→</div>
          <div style={slotBg(true)}>{resultItem.replace('minecraft:','')}</div>
        </div>
        <div style={{ color:'#94a3b8', fontSize:10, marginTop:8 }}>
          XP: {exp} · Time: {time} ticks ({(time/20).toFixed(1)}s)
        </div>
      </div>
    )
  }

  return (
    <div style={{ color:'#94a3b8', fontSize:12 }}>
      Recipe type: <span style={{ color:'#60a5fa' }}>{data.type || 'unknown'}</span>
      <pre style={{ marginTop:8, fontSize:10, color:'#64748b', overflow:'auto', maxHeight:200 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

// ── Loot Table Chest Preview ───────────────────────────────────────────────────
function rollLootTable(data) {
  const results = []
  const pools = data.pools || []

  for (const pool of pools) {
    let rolls
    if (typeof pool.rolls === 'object' && pool.rolls !== null) {
      const min = pool.rolls.min ?? 1
      const max = pool.rolls.max ?? 1
      rolls = Math.floor(Math.random() * (max - min + 1)) + min
    } else {
      rolls = typeof pool.rolls === 'number' ? pool.rolls : 1
    }

    const entries = (pool.entries || []).filter(e => e.type !== 'minecraft:empty' && e.type !== 'empty')
    if (entries.length === 0) continue

    const totalWeight = entries.reduce((s, e) => s + (e.weight || 1), 0)

    for (let r = 0; r < rolls; r++) {
      let rand = Math.random() * totalWeight
      let chosen = null
      for (const entry of entries) {
        rand -= (entry.weight || 1)
        if (rand <= 0) { chosen = entry; break }
      }
      if (!chosen) chosen = entries[entries.length - 1]

      const name = chosen.name || chosen.id || ''
      if (name) {
        // Check for count function
        let count = 1
        const countFn = (chosen.functions || []).find(f => f.function?.includes('set_count'))
        if (countFn?.count) {
          if (typeof countFn.count === 'object') {
            const mn = countFn.count.min ?? 1
            const mx = countFn.count.max ?? 1
            count = Math.floor(Math.random() * (mx - mn + 1)) + mn
          } else {
            count = countFn.count
          }
        }
        results.push({ item: name.replace('minecraft:', ''), count })
      }
    }
  }

  // Build 27-slot chest — scatter items randomly
  const slots = Array(27).fill(null)
  const shuffled = [...results].sort(() => Math.random() - 0.5)
  const positions = Array.from({ length: 27 }, (_, i) => i).sort(() => Math.random() - 0.5)
  shuffled.forEach((item, i) => {
    if (i < 27) slots[positions[i]] = item
  })
  return slots
}

function LootTablePreview({ data }) {
  const [slots, setSlots] = useState(() => rollLootTable(data))
  const [rolling, setRolling] = useState(false)

  const reroll = useCallback(() => {
    setRolling(true)
    setTimeout(() => {
      setSlots(rollLootTable(data))
      setRolling(false)
    }, 250)
  }, [data])

  const slotStyle = (item) => ({
    width: 36, height: 36,
    background: item ? '#1a1a1a' : '#222',
    border: item ? '2px solid #6b7280' : '2px solid #444',
    borderRadius: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 7, color: '#e2e8f0',
    textAlign: 'center', lineHeight: 1.1,
    wordBreak: 'break-all', padding: 1,
    position: 'relative', overflow: 'hidden',
    cursor: item ? 'help' : 'default',
    boxShadow: item ? 'inset 0 0 4px rgba(0,0,0,0.6)' : 'none',
    transition: 'opacity 0.2s',
  })

  const emptySlot = { width:36, height:36, background:'#222', border:'2px solid #444', borderRadius:2 }

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ color:'#a78bfa', fontSize:11, fontWeight:700 }}>
          Loot Table — {data.type?.split(':')[1] || 'chest'}
        </div>
        <button
          onClick={reroll}
          disabled={rolling}
          style={{
            background: rolling ? '#0f1e35' : '#1a2f50',
            border: '1px solid #2a4570',
            borderRadius: 6, color: '#a78bfa', fontSize: 11,
            padding: '4px 12px', cursor: rolling ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
          }}
        >
          🎲 {rolling ? 'Rolling…' : 'Re-roll'}
        </button>
      </div>

      {/* Chest container */}
      <div style={{ opacity: rolling ? 0.4 : 1, transition: 'opacity 0.25s' }}>

        {/* Chest title */}
        <div style={{
          background: 'linear-gradient(180deg,#7a5c14 0%,#5a3e0c 100%)',
          border: '2px solid #3a2800', borderBottom: 'none',
          borderRadius: '4px 4px 0 0',
          padding: '4px 8px', fontSize: 11, color: '#ffe4a0', fontWeight: 700,
        }}>
          Chest
        </div>

        {/* Chest 9×3 grid */}
        <div style={{
          background: '#8c8c8c',
          border: '2px solid #3a2800',
          padding: 6,
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 36px)',
          gap: 2,
          borderRadius: '0 0 4px 4px',
          marginBottom: 12,
        }}>
          {slots.map((slot, i) => (
            <div key={i} title={slot ? `${slot.item}${slot.count > 1 ? ` ×${slot.count}` : ''}` : ''} style={slotStyle(slot)}>
              {slot && (
                <>
                  <span style={{ fontSize: 7, lineHeight: 1.1 }}>
                    {slot.item.length > 9 ? slot.item.slice(0,9) + '…' : slot.item}
                  </span>
                  {slot.count > 1 && (
                    <span style={{
                      position: 'absolute', bottom: 1, right: 2,
                      fontSize: 7, color: '#fff',
                      textShadow: '1px 1px 0 #000',
                      fontWeight: 700,
                    }}>
                      {slot.count}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Inventory label */}
        <div style={{
          background: 'linear-gradient(180deg,#7a5c14 0%,#5a3e0c 100%)',
          border: '2px solid #3a2800', borderBottom: 'none',
          borderRadius: '4px 4px 0 0',
          padding: '4px 8px', fontSize: 11, color: '#ffe4a0', fontWeight: 700,
        }}>
          Inventory
        </div>

        {/* Player inventory 9×3 */}
        <div style={{
          background: '#8c8c8c', border: '2px solid #3a2800',
          padding: 6, borderRadius: '0 0 0 0',
          display: 'grid', gridTemplateColumns: 'repeat(9, 36px)', gap: 2,
        }}>
          {Array(27).fill(null).map((_, i) => <div key={i} style={emptySlot} />)}
        </div>

        {/* Hotbar */}
        <div style={{
          background: '#8c8c8c', border: '2px solid #3a2800', borderTop: 'none',
          padding: '4px 6px 6px', borderRadius: '0 0 4px 4px',
          display: 'grid', gridTemplateColumns: 'repeat(9, 36px)', gap: 2,
          marginTop: 4,
        }}>
          {Array(9).fill(null).map((_, i) => (
            <div key={i} style={{ ...emptySlot, border: '2px solid #555' }} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ color:'#64748b', fontSize:10, marginTop:10 }}>
        {data.pools?.length || 0} pool(s) · {slots.filter(Boolean).length} items this roll
        {' · hover slots to see item names'}
      </div>
    </div>
  )
}

// ── Advancement Preview ────────────────────────────────────────────────────────
function AdvancementPreview({ data }) {
  const display = data.display || {}
  const title = display.title?.text || display.title || 'Advancement'
  const desc  = display.description?.text || display.description || ''
  const frame = display.frame || 'task'
  const icon  = display.icon?.item || ''

  const frameColors = { task:'#5555FF', goal:'#55FF55', challenge:'#FF55FF' }
  const frameColor = frameColors[frame] || '#5555FF'

  return (
    <div>
      <div style={{ color:'#fb923c', fontSize:11, marginBottom:12, fontWeight:700 }}>
        Advancement Preview
      </div>
      <div style={{
        background:'rgba(0,0,0,0.8)', border:`2px solid ${frameColor}`,
        borderRadius:4, padding:'8px 12px', display:'inline-flex', alignItems:'center', gap:10,
        maxWidth:280, boxShadow:`0 0 16px ${frameColor}44`,
      }}>
        <div style={{ width:32, height:32, background:'#1a1a1a', border:`1px solid ${frameColor}`,
          borderRadius: frame==='challenge'?'50%':3, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:11, color:'#fff', flexShrink:0 }}>
          {icon ? icon.replace('minecraft:','').slice(0,4) : '?'}
        </div>
        <div>
          <div style={{ color:'#ffd700', fontSize:10, marginBottom:2 }}>
            {frame === 'challenge' ? '✦ Challenge Complete!' : frame === 'goal' ? '⬡ Goal Reached!' : '✓ Advancement Made!'}
          </div>
          <div style={{ color:'#fff', fontSize:12, fontWeight:700 }}>{typeof title==='string' ? title : JSON.stringify(title)}</div>
          {desc && <div style={{ color:'#ccc', fontSize:10, marginTop:2 }}>{typeof desc==='string' ? desc : JSON.stringify(desc)}</div>}
        </div>
      </div>
      <div style={{ color:'#64748b', fontSize:10, marginTop:12 }}>
        Trigger: <span style={{ color:'#60a5fa' }}>{Object.keys(data.criteria||{})[0] || 'none'}</span>
        {' · '} Frame: <span style={{ color:frameColor }}>{frame}</span>
        {data.parent && <><span> · </span>Parent: <span style={{ color:'#94a3b8' }}>{data.parent}</span></>}
      </div>
    </div>
  )
}

// ── Tellraw Preview ────────────────────────────────────────────────────────────
function TellrawPreview({ content }) {
  const lines = (content || '').split('\n')
  const tellrawLine = lines.find(l => l.trim().startsWith('tellraw'))
  const jsonStr = tellrawLine
    ? tellrawLine.replace(/^.*?tellraw\s+@[aeprs](?:\[.*?\])?\s+/, '').trim()
    : null

  if (!jsonStr) return (
    <div style={{ color:'#64748b', fontSize:11 }}>
      No <code style={{ color:'#fbbf24' }}>tellraw</code> command found in this file.
    </div>
  )

  try {
    const parsed = JSON.parse(jsonStr)
    return (
      <div>
        <div style={{ color:'#fbbf24', fontSize:11, marginBottom:8, fontWeight:700 }}>💬 Tellraw Preview</div>
        <div style={{ background:'rgba(0,0,0,0.6)', borderRadius:4, padding:'6px 10px',
          fontFamily:'monospace', fontSize:13, textShadow:'1px 1px 0 rgba(0,0,0,0.8)' }}>
          {renderTellraw(parsed)}
        </div>
      </div>
    )
  } catch {
    return <div style={{ color:'#ef4444', fontSize:11 }}>Could not parse tellraw JSON</div>
  }
}

// ── Texture Preview ────────────────────────────────────────────────────────────
function TexturePreview({ dataUrl }) {
  return (
    <div>
      <div style={{ color:'#38bdf8', fontSize:11, marginBottom:8, fontWeight:700 }}>Texture Preview</div>
      <div style={{ background:'#0a0a1a', border:'1px solid #1a3050', borderRadius:8, padding:12,
        display:'flex', alignItems:'center', justifyContent:'center', minHeight:80 }}>
        <img
          src={dataUrl}
          alt="texture"
          style={{ imageRendering:'pixelated', maxWidth:128, maxHeight:128,
            border:'1px solid #1a3050', borderRadius:2 }}
        />
      </div>
    </div>
  )
}

// ── Tag Preview ────────────────────────────────────────────────────────────────
function TagPreview({ data, path }) {
  const values = data.values || []
  const tagType = path.includes('/blocks/') ? 'Block' : path.includes('/items/') ? 'Item'
    : path.includes('/entity_types/') ? 'Entity' : path.includes('/functions/') ? 'Function' : 'Tag'
  return (
    <div>
      <div style={{ color:'#34d399', fontSize:11, marginBottom:8, fontWeight:700 }}>🏷️ {tagType} Tag</div>
      {data.replace && <div style={{ color:'#fbbf24', fontSize:10, marginBottom:6 }}>⚠️ replace: true</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {values.map((v,i) => (
          <div key={i} style={{ background:'#0b1525', border:'1px solid #1a3050', borderRadius:4,
            padding:'4px 8px', fontSize:11, color:'#e2e8f0', fontFamily:'monospace' }}>
            {typeof v === 'string' ? v : v.id || JSON.stringify(v)}
            {typeof v === 'object' && v.required === false &&
              <span style={{ color:'#64748b', fontSize:9 }}> (optional)</span>}
          </div>
        ))}
        {values.length === 0 && <div style={{ color:'#64748b', fontSize:11 }}>No values</div>}
      </div>
    </div>
  )
}

// ── Main PreviewPanel ──────────────────────────────────────────────────────────
export default function PreviewPanel() {
  const { activeTab, files } = useStore()

  const { type, data, raw } = useMemo(() => {
    if (!activeTab || files[activeTab] === undefined) return { type:'none' }
    const content = files[activeTab]
    const p = activeTab.toLowerCase()

    if (typeof content === 'string' && content.startsWith('data:image/')) {
      return { type:'texture', data: content }
    }

    let parsed = null
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try { parsed = JSON.parse(content) } catch {}
    }

    if (p.includes('/recipes/') && parsed)      return { type:'recipe',      data: parsed }
    if (p.includes('/loot_tables/') && parsed)  return { type:'loottable',   data: parsed }
    if (p.includes('/advancements/') && parsed) return { type:'advancement', data: parsed }
    if (p.includes('/tags/') && parsed)         return { type:'tag',         data: parsed, raw: p }
    if (p.endsWith('.mcfunction'))              return { type:'mcfunction',  raw: content }

    return { type:'nothing' }
  }, [activeTab, files])

  const bgStyle = {
    background:'#060c18',
    border:'1px solid #1a3050',
    borderRadius:10,
    padding:16,
    minHeight:80,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3">

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <p className="label mb-0">In-Game Preview</p>
          {activeTab && (
            <span style={{ fontSize:10, color:'#334155', fontFamily:'monospace' }}>
              {activeTab.split('/').pop()}
            </span>
          )}
        </div>

        <div style={bgStyle}>
          {type === 'none' && (
            <div style={{ color:'#334155', fontSize:12, textAlign:'center', padding:'20px 0' }}>
              Open a file to see a preview
            </div>
          )}
          {type === 'nothing' && (
            <div style={{ color:'#334155', fontSize:12, textAlign:'center', padding:'20px 0' }}>
              Nothing to preview for this file type
            </div>
          )}
          {type === 'recipe'      && <RecipePreview data={data} />}
          {type === 'loottable'   && <LootTablePreview data={data} />}
          {type === 'advancement' && <AdvancementPreview data={data} />}
          {type === 'tag'         && <TagPreview data={data} path={raw} />}
          {type === 'mcfunction'  && <TellrawPreview content={raw} />}
          {type === 'texture'     && <TexturePreview dataUrl={data} />}
        </div>

        {type === 'mcfunction' && (
          <div style={{ marginTop:12, color:'#64748b', fontSize:10 }}>
            Tip: Add a <code style={{ color:'#fbbf24' }}>tellraw @a ...</code> command to see the chat preview above.
          </div>
        )}
      </div>
    </div>
  )
}
