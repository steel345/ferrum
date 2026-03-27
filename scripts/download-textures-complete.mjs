/**
 * Downloads ALL Minecraft 1.20.1 textures from GitHub and builds
 * a complete allItems.js with every item that has a texture.
 * Run with: node scripts/download-textures-complete.mjs
 */
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const TEX_DIR = path.join(ROOT, 'public', 'mc-textures')
const ITEM_DIR = path.join(TEX_DIR, 'item')
const BLOCK_DIR = path.join(TEX_DIR, 'block')
const TEX_BASE = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/textures'
const API_BASE = 'https://api.github.com/repos/InventivetalentDev/minecraft-assets/contents/assets/minecraft/textures'

fs.mkdirSync(ITEM_DIR, { recursive: true })
fs.mkdirSync(BLOCK_DIR, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

function get(url, json = false) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'ferrum-texture-dl' } }
    https.get(url, opts, res => {
      if (res.statusCode === 301 || res.statusCode === 302)
        return get(res.headers.location, json).then(resolve).catch(reject)
      if (res.statusCode !== 200) return resolve(null)
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (json) { try { resolve(JSON.parse(buf.toString())) } catch { resolve(null) } }
        else resolve(buf)
      })
    }).on('error', () => resolve(null))
  })
}

async function listTextures(type) {
  const data = await get(`${API_BASE}/${type}?ref=1.20.1`, true)
  if (!Array.isArray(data)) return []
  return data.filter(f => f.name.endsWith('.png')).map(f => f.name.replace('.png', ''))
}

async function downloadMissing(names, type) {
  const dir = path.join(TEX_DIR, type)
  const have = new Set(fs.readdirSync(dir).map(f => f.replace('.png', '')))
  const missing = names.filter(n => !have.has(n))
  console.log(`  ${type}: ${names.length} total, ${have.size} have, ${missing.length} to download`)

  let done = 0
  const BATCH = 12
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH)
    await Promise.all(batch.map(async name => {
      const buf = await get(`${TEX_BASE}/${type}/${name}.png`)
      if (buf && buf.length > 100) {
        fs.writeFileSync(path.join(dir, `${name}.png`), buf)
        done++
      }
    }))
    await sleep(80)
  }
  console.log(`  Downloaded ${done} new ${type} textures`)
  return done
}

function toLabel(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Items that are definitely block items (use block texture)
const BLOCK_ITEMS = new Set([
  'stone','granite','polished_granite','diorite','polished_diorite','andesite','polished_andesite',
  'grass_block','dirt','coarse_dirt','podzol','rooted_dirt','mud','cobblestone',
])

async function main() {
  console.log('Fetching texture lists from GitHub API...')
  const [itemNames, blockNames] = await Promise.all([
    listTextures('item'),
    listTextures('block'),
  ])
  console.log(`GitHub: ${itemNames.length} item textures, ${blockNames.length} block textures`)

  console.log('Downloading missing textures...')
  await downloadMissing(itemNames, 'item')
  await downloadMissing(blockNames, 'block')

  // Build complete item list — every item that has a texture
  const items = []
  const seen = new Set()

  // Item textures first (higher priority)
  for (const name of itemNames) {
    if (seen.has(name)) continue
    seen.add(name)
    if (fs.existsSync(path.join(ITEM_DIR, `${name}.png`))) {
      items.push({ id: `minecraft:${name}`, label: toLabel(name), tex: `item/${name}.png` })
    }
  }

  // Block textures for blocks not already covered by item textures
  // Only include blocks that look like actual block items (not animated/overlay textures)
  const skipPatterns = ['_top','_bottom','_side','_front','_back','_inner','_outer',
    '_on','_off','_lit','_unlit','_overlay','_stage','_occupied','_powered',
    '_active','_open','_closed','_north','_south','_east','_west',
    '_particle','_flow','_still','_ice']

  for (const name of blockNames) {
    if (seen.has(name)) continue
    // Skip texture variants (only keep base block textures)
    if (skipPatterns.some(p => name.endsWith(p))) continue
    // Skip some pure texture variants
    if (name.includes('_break_') || name.includes('destroy_')) continue
    seen.add(name)
    if (fs.existsSync(path.join(BLOCK_DIR, `${name}.png`))) {
      items.push({ id: `minecraft:${name}`, label: toLabel(name), tex: `block/${name}.png` })
    }
  }

  // Also add items from existing allItems.js that might not have textures
  // (keep items from PrismarineJS that have no texture)
  const existing = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src', 'data', 'allItems.js'), 'utf8')
      .replace(/^\/\/.*\n/gm, '').replace('export const ALL_MC_ITEMS = ', '').trim()
  )
  for (const item of existing) {
    const name = item.id.replace('minecraft:', '')
    if (!seen.has(name)) {
      seen.add(name)
      items.push(item) // keep as-is (may have null tex)
    }
  }

  // Sort: items with textures first, then alphabetical
  items.sort((a, b) => {
    if (a.tex && !b.tex) return -1
    if (!a.tex && b.tex) return 1
    return a.id.localeCompare(b.id)
  })

  const withTex = items.filter(i => i.tex).length
  console.log(`\nTotal items: ${items.length} (${withTex} with textures)`)

  const js = `// Auto-generated by scripts/download-textures-complete.mjs
// ${items.length} items, ${withTex} with textures
export const ALL_MC_ITEMS = ${JSON.stringify(items, null, 2)}
`
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'allItems.js'), js)
  console.log('Written src/data/allItems.js')
}

main().catch(e => { console.error(e); process.exit(1) })
