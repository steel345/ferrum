import React, { useState } from 'react'
import useStore from '../../store/useStore'

// ── Template generators ───────────────────────────────────────────────────────
function makeRecipe(ns, name, type, ingredients, result, count) {
  if (type === 'shapeless') {
    return JSON.stringify({
      type: 'minecraft:crafting_shapeless',
      ingredients: ingredients.filter(Boolean).map(id => ({ item: id.includes(':') ? id : `minecraft:${id}` })),
      result: { item: result.includes(':') ? result : `minecraft:${result}`, count: parseInt(count)||1 },
    }, null, 2)
  }
  if (type === 'smelting' || type === 'smoking' || type === 'blasting') {
    return JSON.stringify({
      type: `minecraft:${type}`,
      ingredient: { item: ingredients[0]?.includes(':') ? ingredients[0] : `minecraft:${ingredients[0]||'iron_ore'}` },
      result: { item: result.includes(':') ? result : `minecraft:${result}` },
      experience: 0.7,
      cookingtime: type === 'smoking' ? 100 : type === 'blasting' ? 100 : 200,
    }, null, 2)
  }
  // Shaped (3x3)
  return JSON.stringify({
    type: 'minecraft:crafting_shaped',
    pattern: ['###', ' X ', ' X '],
    key: {
      '#': { item: ingredients[0]?.includes(':') ? ingredients[0] : `minecraft:${ingredients[0]||'iron_ingot'}` },
      'X': { item: 'minecraft:stick' },
    },
    result: { item: result.includes(':') ? result : `minecraft:${result}`, count: parseInt(count)||1 },
  }, null, 2)
}

function makeFunction(name, template) {
  const templates = {
    blank: `# ${name}\n# Created with Ferrum\n\n`,
    give: `# Give item to player\ngive @s minecraft:diamond 1\n`,
    effect: `# Apply effect to player\neffect give @s minecraft:speed 30 1\n`,
    message: `# Send message to all players\ntellraw @a {"text":"Hello from ${name}!","color":"gold"}\n`,
    loop: `# This function is called every tick (if added to tick.json)\n# Add code here\n`,
    tp: `# Teleport player\ntp @s ~ ~1 ~\n`,
  }
  return templates[template] || templates.blank
}

function makeAdvancement(ns, name, title, desc, trigger, icon, frame) {
  return JSON.stringify({
    display: {
      icon: { item: icon.includes(':') ? icon : `minecraft:${icon||'diamond'}` },
      title: { text: title || name },
      description: { text: desc || '' },
      frame: frame || 'task',
      show_toast: true,
      announce_to_chat: true,
    },
    criteria: {
      [`${name}_trigger`]: {
        trigger: trigger || 'minecraft:impossible',
      },
    },
  }, null, 2)
}

function makeLootTable(ns, name, lootType, entries) {
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

function makeTag(ns, name, tagType, values) {
  return JSON.stringify({
    replace: false,
    values: values.filter(Boolean).map(v => v.includes(':') ? v : `minecraft:${v}`),
  }, null, 2)
}

function makeBlockModel(ns, name, parentModel, texturePath) {
  return JSON.stringify({
    parent: parentModel || 'minecraft:block/cube_all',
    textures: { all: texturePath || `${ns}:block/${name}` },
  }, null, 2)
}

function makeItemModel(ns, name, parentModel, texturePath) {
  return JSON.stringify({
    parent: parentModel || 'minecraft:item/generated',
    textures: { layer0: texturePath || `${ns}:item/${name}` },
  }, null, 2)
}

// ── Wizard steps config ────────────────────────────────────────────────────────
const TYPES = [
  { id:'recipe',      label:'Recipe',       icon:'🔨', desc:'Crafting, smelting, smoking, blasting' },
  { id:'function',    label:'Function',     icon:'⚙️', desc:'.mcfunction file with commands' },
  { id:'advancement', label:'Advancement',  icon:'🏆', desc:'Achievement / advancement toast' },
  { id:'loot_table',  label:'Loot Table',   icon:'🎲', desc:'Drops for chests, mobs, blocks' },
  { id:'tag',         label:'Tag',          icon:'🏷️', desc:'Group items, blocks or entities' },
  { id:'block',       label:'Block/Item Model', icon:'🧱', desc:'JSON model for a custom block or item' },
]

export default function CreateWizard({ onClose }) {
  const { project, createFile, showToast } = useStore()
  const [step, setStep]     = useState('pick')  // 'pick' | 'form'
  const [type, setType]     = useState(null)
  const [form, setForm]     = useState({})

  const ns  = project?.namespace || 'my_namespace'
  const dp  = project?.datpackRoot || ns + '_datapack'
  const rp  = project?.resourcepackRoot || ns + '_resourcepack'
  const base = `${dp}/data/${ns}`

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  const f = form

  function create() {
    const name = (f.name || 'unnamed').replace(/\s+/g,'_').toLowerCase()
    let path = '', content = ''

    if (type === 'recipe') {
      path = `${base}/recipes/${name}.json`
      content = makeRecipe(ns, name, f.recipeType||'shaped', (f.ingredients||'').split(',').map(s=>s.trim()), f.result||'diamond', f.count||1)
    } else if (type === 'function') {
      path = `${base}/functions/${name}.mcfunction`
      content = makeFunction(name, f.template||'blank')
    } else if (type === 'advancement') {
      path = `${base}/advancements/${name}.json`
      content = makeAdvancement(ns, name, f.title||name, f.desc||'', f.trigger||'minecraft:impossible', f.icon||'diamond', f.frame||'task')
    } else if (type === 'loot_table') {
      path = `${base}/loot_tables/${name}.json`
      content = makeLootTable(ns, name, f.lootType||'chest', (f.entries||'').split(',').map(s=>s.trim()))
    } else if (type === 'tag') {
      const tagFolder = f.tagType || 'items'
      path = `${base}/tags/${tagFolder}/${name}.json`
      content = makeTag(ns, name, f.tagType||'items', (f.values||'').split(',').map(s=>s.trim()))
    } else if (type === 'block') {
      const isBlock = (f.modelType||'block') === 'block'
      path = isBlock
        ? `${rp}/assets/${ns}/models/block/${name}.json`
        : `${rp}/assets/${ns}/models/item/${name}.json`
      content = isBlock
        ? makeBlockModel(ns, name, f.parent, f.texture)
        : makeItemModel(ns, name, f.parent, f.texture)
    }

    if (!path) return
    createFile(path, content)
    showToast(`Created ${path.split('/').pop()}`, 'success')
    onClose()
  }

  const ready = form.name?.trim()

  // ── Step: pick type ────────────────────────────────────────────────────────
  if (step === 'pick') return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#07111f', border:'1px solid #1a3050', borderRadius:14,
        padding:28, width:520, maxWidth:'95vw', boxShadow:'0 0 60px rgba(37,99,235,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ color:'#e2e8f0', fontSize:16, fontWeight:700, margin:0 }}>Create New…</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setForm({}); setStep('form') }}
              style={{
                background:'#0b1525', border:'1px solid #1a3050', borderRadius:10,
                padding:'14px 16px', cursor:'pointer', textAlign:'left',
                display:'flex', alignItems:'center', gap:12, transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.background='#0f1e35' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#1a3050'; e.currentTarget.style.background='#0b1525' }}
            >
              <span style={{ fontSize:24 }}>{t.icon}</span>
              <div>
                <div style={{ color:'#e2e8f0', fontSize:13, fontWeight:700 }}>{t.label}</div>
                <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Step: form ────────────────────────────────────────────────────────────
  const T = TYPES.find(t => t.id === type)

  function Input({ label, k, placeholder, hint }) {
    return (
      <div style={{ marginBottom:12 }}>
        <label style={{ color:'#93c5fd', fontSize:11, display:'block', marginBottom:4 }}>{label}</label>
        <input className="input text-xs py-1.5" style={{ width:'100%' }}
          placeholder={placeholder}
          value={f[k]||''}
          onChange={e => set(k, e.target.value)} />
        {hint && <p style={{ color:'#334155', fontSize:10, marginTop:3 }}>{hint}</p>}
      </div>
    )
  }

  function Select({ label, k, options }) {
    return (
      <div style={{ marginBottom:12 }}>
        <label style={{ color:'#93c5fd', fontSize:11, display:'block', marginBottom:4 }}>{label}</label>
        <select className="select text-xs w-full" value={f[k]||options[0].value}
          onChange={e => set(k, e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#07111f', border:'1px solid #1a3050', borderRadius:14,
        padding:28, width:460, maxWidth:'95vw', boxShadow:'0 0 60px rgba(37,99,235,0.15)',
        maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <button onClick={() => setStep('pick')}
            style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>←</button>
          <span style={{ fontSize:20 }}>{T?.icon}</span>
          <h2 style={{ color:'#e2e8f0', fontSize:15, fontWeight:700, margin:0 }}>New {T?.label}</h2>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        {/* Always: Name */}
        <Input label="Name (used as filename)" k="name"
          placeholder={type === 'function' ? 'my_function' : type === 'recipe' ? 'my_recipe' : 'my_' + type} />

        {/* Recipe fields */}
        {type === 'recipe' && <>
          <Select label="Recipe type" k="recipeType" options={[
            { value:'shaped',    label:'Shaped (3×3 grid)' },
            { value:'shapeless', label:'Shapeless' },
            { value:'smelting',  label:'Smelting (Furnace)' },
            { value:'smoking',   label:'Smoking (Smoker)' },
            { value:'blasting',  label:'Blasting (Blast Furnace)' },
          ]} />
          <Input label="Ingredient(s)" k="ingredients"
            placeholder="iron_ingot, stick, ..."
            hint="Comma-separated. For smelting, only the first item is used." />
          <Input label="Result item" k="result" placeholder="iron_sword" />
          <Input label="Result count" k="count" placeholder="1" />
        </>}

        {/* Function fields */}
        {type === 'function' && <>
          <Select label="Starting template" k="template" options={[
            { value:'blank',   label:'Blank' },
            { value:'give',    label:'Give item to player' },
            { value:'effect',  label:'Apply potion effect' },
            { value:'message', label:'Send chat message' },
            { value:'loop',    label:'Tick loop (empty)' },
            { value:'tp',      label:'Teleport player' },
          ]} />
        </>}

        {/* Advancement fields */}
        {type === 'advancement' && <>
          <Input label="Title" k="title" placeholder="My Advancement" />
          <Input label="Description" k="desc" placeholder="Do something cool" />
          <Input label="Icon item" k="icon" placeholder="diamond" />
          <Select label="Frame" k="frame" options={[
            { value:'task',      label:'Task (rectangle)' },
            { value:'goal',      label:'Goal (rounded)' },
            { value:'challenge', label:'Challenge (spiky)' },
          ]} />
          <Input label="Trigger" k="trigger" placeholder="minecraft:impossible"
            hint="e.g. minecraft:inventory_changed, minecraft:location, etc." />
        </>}

        {/* Loot table fields */}
        {type === 'loot_table' && <>
          <Select label="Loot table type" k="lootType" options={[
            { value:'chest',       label:'Chest' },
            { value:'entity',      label:'Entity (mob drops)' },
            { value:'block',       label:'Block' },
            { value:'fishing',     label:'Fishing' },
            { value:'gift',        label:'Gift' },
          ]} />
          <Input label="Items (comma-separated)" k="entries"
            placeholder="diamond, iron_ingot, gold_ingot"
            hint="Use minecraft: prefix or just the item name" />
        </>}

        {/* Tag fields */}
        {type === 'tag' && <>
          <Select label="Tag type" k="tagType" options={[
            { value:'items',        label:'Items' },
            { value:'blocks',       label:'Blocks' },
            { value:'entity_types', label:'Entity Types' },
            { value:'functions',    label:'Functions' },
          ]} />
          <Input label="Values (comma-separated)" k="values"
            placeholder="diamond, iron_ingot, gold_ingot"
            hint="Will be prefixed with minecraft: if no namespace given" />
        </>}

        {/* Block/Item model fields */}
        {type === 'block' && <>
          <Select label="Model type" k="modelType" options={[
            { value:'block', label:'Block model' },
            { value:'item',  label:'Item model' },
          ]} />
          <Input label="Parent model" k="parent"
            placeholder="minecraft:block/cube_all"
            hint="Block: cube_all, cross, etc. · Item: item/generated, item/handheld" />
          <Input label="Texture path" k="texture"
            placeholder={`${ns}:block/my_block`}
            hint="Namespace:type/name path to your texture file" />
        </>}

        {/* Buttons */}
        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px 0', borderRadius:8, background:'transparent',
              border:'1px solid #1a3050', color:'#64748b', fontSize:13, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#1a3050'}>
            Cancel
          </button>
          <button onClick={create} disabled={!ready}
            style={{ flex:2, padding:'10px 0', borderRadius:8, border:'none',
              background: ready ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1a3050',
              color: ready ? '#fff' : '#334155', fontSize:13, fontWeight:700,
              cursor: ready ? 'pointer' : 'not-allowed' }}>
            ✦ Create {T?.label}
          </button>
        </div>

        {/* Preview path */}
        {form.name && (
          <p style={{ color:'#1e3050', fontSize:10, marginTop:8, fontFamily:'monospace', textAlign:'center' }}>
            Will create: {form.name.replace(/\s+/g,'_').toLowerCase()}
            {type === 'function' ? '.mcfunction' : '.json'}
          </p>
        )}
      </div>
    </div>
  )
}
