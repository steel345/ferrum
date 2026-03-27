import React, { useMemo } from 'react'
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

  // Shaped: build 3x3 grid
  if (isShaped && data.pattern && data.key) {
    const rows = data.pattern.map(row => row.split(''))
    while (rows.length < 3) rows.push(['','',''])
    const grid = rows.map(row => { while(row.length<3) row.push(''); return row })
    return (
      <div style={{ fontFamily:'monospace' }}>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          🔨 Shaped Recipe — {data.type?.split(':')[1] || 'crafting_shaped'}
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

  // Shapeless
  if (isShapeless && data.ingredients) {
    const ing = data.ingredients.slice(0,9)
    return (
      <div>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          🔀 Shapeless Recipe
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

  // Smelting
  if (isSmelting) {
    const ingredient = data.ingredient ? itemLabel(data.ingredient) : '?'
    const exp = data.experience || 0
    const time = data.cookingtime || 200
    return (
      <div>
        <div style={{ color:'#4ade80', fontSize:11, marginBottom:10, fontWeight:700 }}>
          🔥 {data.type?.split(':')[1]?.replace(/_/g,' ') || 'Smelting'}
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

  // Fallback
  return (
    <div style={{ color:'#94a3b8', fontSize:12 }}>
      Recipe type: <span style={{ color:'#60a5fa' }}>{data.type || 'unknown'}</span>
      <pre style={{ marginTop:8, fontSize:10, color:'#64748b', overflow:'auto', maxHeight:200 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

// ── Loot Table Preview ─────────────────────────────────────────────────────────
function LootTablePreview({ data }) {
  const pools = data.pools || []
  return (
    <div>
      <div style={{ color:'#a78bfa', fontSize:11, marginBottom:10, fontWeight:700 }}>
        🎲 Loot Table — type: {data.type?.split(':')[1] || 'generic'}
      </div>
      {pools.map((pool, pi) => (
        <div key={pi} style={{ background:'#0b1525', border:'1px solid #1a3050', borderRadius:8, padding:10, marginBottom:8 }}>
          <div style={{ color:'#60a5fa', fontSize:10, marginBottom:6 }}>
            Pool {pi+1} · rolls: {typeof pool.rolls === 'object'
              ? `${pool.rolls.min}–${pool.rolls.max}`
              : pool.rolls || 1}
          </div>
          {(pool.entries || []).map((entry, ei) => (
            <div key={ei} style={{ color:'#e2e8f0', fontSize:11, padding:'3px 0', borderTop: ei>0 ? '1px solid #1a3050' : 'none' }}>
              <span style={{ color:'#fbbf24' }}>{entry.type?.split(':')[1] || 'item'}</span>
              {' · '}
              <span>{entry.name || entry.loot_table || '[entry]'}</span>
              {entry.weight && <span style={{ color:'#64748b' }}> (weight: {entry.weight})</span>}
            </div>
          ))}
        </div>
      ))}
      {pools.length === 0 && <div style={{ color:'#64748b', fontSize:11 }}>No pools defined</div>}
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
        🏆 Advancement Preview
      </div>
      {/* Minecraft-style advancement toast */}
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
      <div style={{ color:'#38bdf8', fontSize:11, marginBottom:8, fontWeight:700 }}>🖼️ Texture Preview</div>
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
    const path = activeTab.toLowerCase()

    // Texture (stored as data URL)
    if (typeof content === 'string' && content.startsWith('data:image/')) {
      return { type:'texture', data: content }
    }

    // Parse JSON if applicable
    let parsed = null
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try { parsed = JSON.parse(content) } catch {}
    }

    if (path.includes('/recipes/') && parsed)      return { type:'recipe',      data: parsed }
    if (path.includes('/loot_tables/') && parsed)  return { type:'loottable',   data: parsed }
    if (path.includes('/advancements/') && parsed) return { type:'advancement', data: parsed }
    if (path.includes('/tags/') && parsed)         return { type:'tag',         data: parsed, raw: path }
    if (path.endsWith('.mcfunction'))              return { type:'mcfunction',  raw: content }

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

        {/* Header */}
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

        {/* Tellraw quick editor (only on mcfunction files) */}
        {type === 'mcfunction' && (
          <div style={{ marginTop:12, color:'#64748b', fontSize:10 }}>
            Tip: Add a <code style={{ color:'#fbbf24' }}>tellraw @a ...</code> command to see the chat preview above.
          </div>
        )}
      </div>
    </div>
  )
}
