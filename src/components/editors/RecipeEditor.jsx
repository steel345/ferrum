import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { MC_ITEMS } from '../../data/minecraftData'
import { RefreshCw, Code, Eye, Plus, Trash2, ChevronDown } from 'lucide-react'

const RECIPE_TYPES = [
  { id: 'minecraft:crafting_shaped',    label: 'Shaped Crafting',  icon: '🔨' },
  { id: 'minecraft:crafting_shapeless', label: 'Shapeless Crafting', icon: '🔄' },
  { id: 'minecraft:smelting',           label: 'Smelting',         icon: '🔥' },
  { id: 'minecraft:blasting',           label: 'Blasting',         icon: '⚡' },
  { id: 'minecraft:smoking',            label: 'Smoking',          icon: '💨' },
  { id: 'minecraft:campfire_cooking',   label: 'Campfire Cooking', icon: '🏕️' },
  { id: 'minecraft:stonecutting',       label: 'Stonecutting',     icon: '🪨' },
  { id: 'minecraft:smithing_transform', label: 'Smithing',         icon: '⚒️' },
]

function parseRecipe(content) {
  try { return JSON.parse(content) }
  catch { return null }
}

function ItemSlot({ item, onClear, onClick, size = 56, label }) {
  const found = item ? MC_ITEMS.find(i => i.id === item) : null
  return (
    <div
      className={`recipe-cell ${item ? 'filled' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      title={item || 'Empty slot – click to set item'}
    >
      {found ? (
        <>
          <span className="item-icon">{found.emoji}</span>
          <span style={{ fontSize: 8, color: '#94a3b8', lineHeight: 1, textAlign: 'center' }}>
            {found.label.length > 12 ? found.label.slice(0, 12) + '…' : found.label}
          </span>
          {onClear && (
            <button
              className="absolute top-0 right-0 p-0.5 rounded-bl"
              style={{ background: '#3b0a0a', color: '#fca5a5', fontSize: 9 }}
              onClick={e => { e.stopPropagation(); onClear() }}
            >✕</button>
          )}
        </>
      ) : (
        <span style={{ color: '#1e3050', fontSize: 20 }}>+</span>
      )}
    </div>
  )
}

export default function RecipeEditor({ path }) {
  const { files, updateFile, saveFile, openItemPicker } = useStore()
  const [viewMode, setViewMode] = useState('visual') // 'visual' | 'json'
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const parsed = parseRecipe(files[path] || '{}')
    if (parsed) { setRecipe(parsed); setError('') }
    else setError('Invalid JSON')
  }, [path, files[path]])

  function save(newRecipe) {
    const str = JSON.stringify(newRecipe, null, 2)
    updateFile(path, str)
    setRecipe(newRecipe)
  }

  function setType(typeId) {
    const templates = {
      'minecraft:crafting_shaped': {
        type: 'minecraft:crafting_shaped',
        category: 'misc',
        pattern: ['   ', '   ', '   '],
        key: {},
        result: { id: 'minecraft:stone', count: 1 },
      },
      'minecraft:crafting_shapeless': {
        type: 'minecraft:crafting_shapeless',
        category: 'misc',
        ingredients: [],
        result: { id: 'minecraft:stone', count: 1 },
      },
      'minecraft:smelting': {
        type: 'minecraft:smelting',
        category: 'misc',
        ingredient: { item: 'minecraft:iron_ore' },
        result: { id: 'minecraft:iron_ingot' },
        experience: 0.7,
        cookingtime: 200,
      },
      'minecraft:blasting': {
        type: 'minecraft:blasting',
        category: 'misc',
        ingredient: { item: 'minecraft:iron_ore' },
        result: { id: 'minecraft:iron_ingot' },
        experience: 0.7,
        cookingtime: 100,
      },
      'minecraft:smoking': {
        type: 'minecraft:smoking',
        category: 'food',
        ingredient: { item: 'minecraft:beef' },
        result: { id: 'minecraft:cooked_beef' },
        experience: 0.35,
        cookingtime: 100,
      },
      'minecraft:campfire_cooking': {
        type: 'minecraft:campfire_cooking',
        category: 'food',
        ingredient: { item: 'minecraft:beef' },
        result: { id: 'minecraft:cooked_beef' },
        experience: 0.35,
        cookingtime: 600,
      },
      'minecraft:stonecutting': {
        type: 'minecraft:stonecutting',
        ingredient: { item: 'minecraft:stone' },
        result: { id: 'minecraft:stone_slab', count: 2 },
      },
      'minecraft:smithing_transform': {
        type: 'minecraft:smithing_transform',
        template: { item: 'minecraft:netherite_upgrade_smithing_template' },
        base: { item: 'minecraft:diamond_sword' },
        addition: { item: 'minecraft:netherite_ingot' },
        result: { id: 'minecraft:netherite_sword' },
      },
    }
    save(templates[typeId] || { type: typeId })
  }

  // ── Shaped crafting grid ──────────────────────────────────────────────────
  function getShapedSlots() {
    if (!recipe?.pattern || !recipe?.key) return Array(9).fill(null)
    const slots = Array(9).fill(null)
    recipe.pattern.forEach((row, r) => {
      for (let c = 0; c < 3; c++) {
        const ch = row[c] || ' '
        slots[r * 3 + c] = ch !== ' ' ? (recipe.key[ch]?.item || recipe.key[ch]?.tag || null) : null
      }
    })
    return slots
  }

  function setShapedSlot(idx, itemId) {
    const r = Math.floor(idx / 3)
    const c = idx % 3
    // Find or create a key character
    const currentCh = recipe.pattern[r][c] !== ' ' ? recipe.pattern[r][c] : null
    const newRecipe  = JSON.parse(JSON.stringify(recipe))

    if (!itemId) {
      // Clear slot
      const rows = newRecipe.pattern.map((row, ri) =>
        row.split('').map((ch, ci) => (ri === r && ci === c) ? ' ' : ch).join('')
      )
      newRecipe.pattern = rows
    } else {
      // Find existing key for this item or create new one
      const existingKey = Object.entries(newRecipe.key || {}).find(([k, v]) => v.item === itemId)?.[0]
      const usedKeys = new Set(newRecipe.pattern.join('').replace(/ /g, ''))
      let ch = existingKey
      if (!ch) {
        // Pick first unused character
        for (const candidate of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%^&*!') {
          if (!usedKeys.has(candidate)) { ch = candidate; break }
        }
        newRecipe.key = { ...(newRecipe.key || {}), [ch]: { item: itemId } }
      }
      const rows = newRecipe.pattern.map((row, ri) =>
        row.split('').map((c2, ci) => (ri === r && ci === c) ? ch : c2).join('')
      )
      newRecipe.pattern = rows
    }

    // Clean unused keys
    const usedNow = new Set(newRecipe.pattern.join('').replace(/ /g, ''))
    newRecipe.key = Object.fromEntries(Object.entries(newRecipe.key || {}).filter(([k]) => usedNow.has(k)))
    save(newRecipe)
  }

  function pickShapedSlot(idx) {
    openItemPicker((id) => setShapedSlot(idx, id))
  }

  // ── Shapeless ingredients ────────────────────────────────────────────────
  function addShapelessIngredient() {
    openItemPicker((id) => {
      const newRecipe = { ...recipe, ingredients: [...(recipe.ingredients || []), { item: id }] }
      save(newRecipe)
    })
  }

  function removeShapelessIngredient(idx) {
    const newRecipe = { ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== idx) }
    save(newRecipe)
  }

  // ── Result ───────────────────────────────────────────────────────────────
  function setResult(itemId) {
    const newRecipe = { ...recipe, result: { ...(recipe.result || {}), id: itemId } }
    save(newRecipe)
  }

  function setResultCount(count) {
    const newRecipe = { ...recipe, result: { ...(recipe.result || {}), count: parseInt(count) || 1 } }
    save(newRecipe)
  }

  // ── Cooking ──────────────────────────────────────────────────────────────
  function setCookingIngredient(itemId) {
    save({ ...recipe, ingredient: { item: itemId } })
  }

  function setCookingResult(itemId) {
    save({ ...recipe, result: { id: itemId } })
  }

  if (!recipe) return (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: '#ef4444' }}>
      {error || 'Loading...'}
    </div>
  )

  const currentType = RECIPE_TYPES.find(t => t.id === recipe.type)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#060c18' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1a3050', background: '#040810' }}>
        <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Recipe Type</span>
        <div className="relative">
          <select
            className="select text-xs py-1 px-2 pr-6"
            value={recipe.type || ''}
            onChange={e => setType(e.target.value)}
          >
            {RECIPE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid #1a3050' }}>
          <button className={`px-3 py-1 text-xs transition-colors ${viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-mc-muted hover:text-white'}`}
            onClick={() => setViewMode('visual')}>
            <Eye size={12} className="inline mr-1" /> Visual
          </button>
          <button className={`px-3 py-1 text-xs transition-colors ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-mc-muted hover:text-white'}`}
            onClick={() => setViewMode('json')}>
            <Code size={12} className="inline mr-1" /> JSON
          </button>
        </div>
        <button className="btn btn-primary text-xs px-3 py-1" onClick={() => saveFile(path)}>Save</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'json' ? (
          <textarea
            className="input font-mono text-xs w-full h-96 resize-none"
            value={JSON.stringify(recipe, null, 2)}
            onChange={e => {
              try {
                const p = JSON.parse(e.target.value)
                setRecipe(p)
                updateFile(path, e.target.value)
              } catch {}
            }}
          />
        ) : (
          <div className="flex flex-col gap-6 max-w-lg">
            {/* Header */}
            <div>
              <h2 className="text-base font-bold" style={{ color: '#e2e8f0' }}>
                {currentType?.icon} {currentType?.label || recipe.type}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Click any slot to set an item · Click ✕ to clear
              </p>
            </div>

            {/* Shaped crafting grid */}
            {recipe.type === 'minecraft:crafting_shaped' && (
              <div className="flex items-start gap-8">
                <div>
                  <p className="label mb-3">Crafting Grid (3×3)</p>
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 56px)' }}>
                    {getShapedSlots().map((item, idx) => (
                      <ItemSlot
                        key={idx}
                        item={item}
                        onClick={() => pickShapedSlot(idx)}
                        onClear={item ? () => setShapedSlot(idx, null) : null}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center self-center">
                  <span className="text-2xl" style={{ color: '#3b82f6' }}>→</span>
                </div>
                <div>
                  <p className="label mb-3">Result</p>
                  <div className="flex flex-col items-center gap-2">
                    <ItemSlot item={recipe.result?.id} onClick={() => openItemPicker(setResult)} size={64} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#64748b' }}>Count:</span>
                      <input
                        type="number" min="1" max="64"
                        value={recipe.result?.count || 1}
                        onChange={e => setResultCount(e.target.value)}
                        className="input text-xs py-0.5 px-2 w-14"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shapeless */}
            {recipe.type === 'minecraft:crafting_shapeless' && (
              <div className="flex items-start gap-8">
                <div>
                  <p className="label mb-3">Ingredients (up to 9)</p>
                  <div className="flex flex-wrap gap-1.5" style={{ maxWidth: 200 }}>
                    {(recipe.ingredients || []).map((ing, idx) => (
                      <ItemSlot
                        key={idx}
                        item={ing?.item || ing?.tag}
                        onClick={() => openItemPicker(id => {
                          const newIng = recipe.ingredients.map((x, i) => i === idx ? { item: id } : x)
                          save({ ...recipe, ingredients: newIng })
                        })}
                        onClear={() => removeShapelessIngredient(idx)}
                      />
                    ))}
                    {(recipe.ingredients?.length || 0) < 9 && (
                      <button className="recipe-cell" onClick={addShapelessIngredient}>
                        <Plus size={16} style={{ color: '#3b82f6' }} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center self-center">
                  <span className="text-2xl" style={{ color: '#3b82f6' }}>→</span>
                </div>
                <div>
                  <p className="label mb-3">Result</p>
                  <div className="flex flex-col items-center gap-2">
                    <ItemSlot item={recipe.result?.id} onClick={() => openItemPicker(setResult)} size={64} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#64748b' }}>Count:</span>
                      <input type="number" min="1" max="64"
                        value={recipe.result?.count || 1}
                        onChange={e => setResultCount(e.target.value)}
                        className="input text-xs py-0.5 px-2 w-14"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cooking recipes */}
            {['minecraft:smelting','minecraft:blasting','minecraft:smoking','minecraft:campfire_cooking'].includes(recipe.type) && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-8">
                  <div>
                    <p className="label mb-3">Ingredient</p>
                    <ItemSlot
                      item={recipe.ingredient?.item || recipe.ingredient?.tag}
                      onClick={() => openItemPicker(setCookingIngredient)}
                      onClear={() => save({ ...recipe, ingredient: {} })}
                      size={64}
                    />
                  </div>
                  <div className="flex items-center self-center text-2xl" style={{ color: '#f97316' }}>
                    {recipe.type === 'minecraft:smelting' ? '🔥' :
                     recipe.type === 'minecraft:blasting' ? '⚡' :
                     recipe.type === 'minecraft:smoking'  ? '💨' : '🏕️'}
                  </div>
                  <div>
                    <p className="label mb-3">Result</p>
                    <ItemSlot item={recipe.result?.id} onClick={() => openItemPicker(setCookingResult)} size={64} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  <div>
                    <p className="label">Experience</p>
                    <input type="number" step="0.1" min="0"
                      value={recipe.experience ?? 0}
                      onChange={e => save({ ...recipe, experience: parseFloat(e.target.value) })}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <p className="label">Cooking Time (ticks)</p>
                    <input type="number" min="0"
                      value={recipe.cookingtime ?? 200}
                      onChange={e => save({ ...recipe, cookingtime: parseInt(e.target.value) })}
                      className="input text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {Math.round((recipe.cookingtime || 200) / 20 * 10) / 10}s cooking time
                </p>
              </div>
            )}

            {/* Stonecutting */}
            {recipe.type === 'minecraft:stonecutting' && (
              <div className="flex items-start gap-8">
                <div>
                  <p className="label mb-3">Input</p>
                  <ItemSlot
                    item={recipe.ingredient?.item}
                    onClick={() => openItemPicker(id => save({ ...recipe, ingredient: { item: id } }))}
                    size={64}
                  />
                </div>
                <div className="flex items-center self-center text-2xl">🪨</div>
                <div>
                  <p className="label mb-3">Result</p>
                  <ItemSlot item={recipe.result?.id} onClick={() => openItemPicker(setResult)} size={64} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs" style={{ color: '#64748b' }}>Count:</span>
                    <input type="number" min="1"
                      value={recipe.result?.count || 1}
                      onChange={e => setResultCount(e.target.value)}
                      className="input text-xs py-0.5 px-2 w-14"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Smithing */}
            {recipe.type === 'minecraft:smithing_transform' && (
              <div className="flex items-start gap-4">
                {[
                  { label: 'Template', key: 'template' },
                  { label: 'Base', key: 'base' },
                  { label: 'Addition', key: 'addition' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="label mb-3">{label}</p>
                    <ItemSlot
                      item={recipe[key]?.item}
                      onClick={() => openItemPicker(id => save({ ...recipe, [key]: { item: id } }))}
                      size={60}
                    />
                  </div>
                ))}
                <div className="flex items-center self-center text-xl mt-6">⚒️</div>
                <div>
                  <p className="label mb-3">Result</p>
                  <ItemSlot item={recipe.result?.id} onClick={() => openItemPicker(setResult)} size={64} />
                </div>
              </div>
            )}

            {/* Category field */}
            {recipe.category !== undefined && (
              <div className="max-w-xs">
                <p className="label">Category</p>
                <select
                  className="select text-xs w-full"
                  value={recipe.category || 'misc'}
                  onChange={e => save({ ...recipe, category: e.target.value })}
                >
                  {['misc','building','redstone','equipment','food'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
