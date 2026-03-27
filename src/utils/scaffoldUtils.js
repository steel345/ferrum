import { FILE_TEMPLATES, MC_VERSIONS } from '../data/minecraftData'

/**
 * Returns a flat map of { path: content } for a brand-new project.
 * Both datapack and resourcepack are created together.
 */
export function scaffoldProject({ name, namespace, description, version, author, template }) {
  const mcver = MC_VERSIONS.find(v => v.id === version) || MC_VERSIONS[0]
  const dpFormat  = mcver.datapack
  const rpFormat  = mcver.resourcepack
  const dp = `${name}_datapack`
  const rp = `${name}_resourcepack`
  const ns = namespace || name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const desc = description || `${name} by ${author || 'Author'}`

  const files = {}

  // ── DATAPACK ────────────────────────────────────────────────────────────
  files[`${dp}/pack.mcmeta`] = JSON.stringify(
    FILE_TEMPLATES.pack_mcmeta_data(desc, dpFormat), null, 2
  )

  // data/<ns>/functions/
  files[`${dp}/data/${ns}/functions/load.mcfunction`] =
    `# Runs on datapack load\n# Project: ${name}\n# Author: ${author || 'Author'}\n\nsay [${name}] Loaded!\n`

  files[`${dp}/data/${ns}/functions/tick.mcfunction`] =
    `# Runs every tick\n# Remove or comment out if not needed\n\n`

  // function tags
  files[`${dp}/data/minecraft/tags/functions/load.json`] =
    JSON.stringify({ values: [`${ns}:load`] }, null, 2)

  files[`${dp}/data/minecraft/tags/functions/tick.json`] =
    JSON.stringify({ values: [`${ns}:tick`] }, null, 2)

  // empty folders (placeholder files)
  files[`${dp}/data/${ns}/recipes/.gitkeep`]       = ''
  files[`${dp}/data/${ns}/loot_tables/.gitkeep`]   = ''
  files[`${dp}/data/${ns}/advancements/.gitkeep`]  = ''
  files[`${dp}/data/${ns}/predicates/.gitkeep`]    = ''
  files[`${dp}/data/${ns}/tags/blocks/.gitkeep`]   = ''
  files[`${dp}/data/${ns}/tags/items/.gitkeep`]    = ''
  files[`${dp}/data/${ns}/tags/entity_types/.gitkeep`] = ''

  // Starter template extras
  if (template === 'starter') {
    files[`${dp}/data/${ns}/recipes/example_recipe.json`] =
      JSON.stringify(FILE_TEMPLATES.recipe_shaped, null, 2)
    files[`${dp}/data/${ns}/loot_tables/example_chest.json`] =
      JSON.stringify(FILE_TEMPLATES.loot_table, null, 2)
    files[`${dp}/data/${ns}/advancements/root.json`] =
      JSON.stringify(FILE_TEMPLATES.advancement, null, 2)
  }

  // ── RESOURCEPACK ────────────────────────────────────────────────────────
  files[`${rp}/pack.mcmeta`] = JSON.stringify(
    FILE_TEMPLATES.pack_mcmeta_res(desc, rpFormat), null, 2
  )

  const lang = {}
  lang[`${ns}.item.example`] = 'Example Item'
  files[`${rp}/assets/${ns}/lang/en_us.json`] = JSON.stringify(lang, null, 2)

  files[`${rp}/assets/${ns}/models/item/.gitkeep`]    = ''
  files[`${rp}/assets/${ns}/models/block/.gitkeep`]   = ''
  files[`${rp}/assets/${ns}/textures/item/.gitkeep`]  = ''
  files[`${rp}/assets/${ns}/textures/block/.gitkeep`] = ''
  files[`${rp}/assets/${ns}/blockstates/.gitkeep`]    = ''
  files[`${rp}/assets/${ns}/sounds/.gitkeep`]         = ''
  files[`${rp}/assets/${ns}/font/.gitkeep`]           = ''

  files[`${rp}/assets/${ns}/sounds.json`] = JSON.stringify({}, null, 2)

  return { files, datpackRoot: dp, resourcepackRoot: rp, namespace: ns }
}

/**
 * Given a flat file map, build a tree structure for the sidebar.
 * Returns an array of nodes: { name, path, type: 'file'|'folder', children? }
 */
export function buildFileTree(fileMap) {
  const root = {}

  for (const filePath of Object.keys(fileMap)) {
    const parts = filePath.split('/')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!node[part]) {
        node[part] = { __children: {}, __isFile: i === parts.length - 1, __path: parts.slice(0, i + 1).join('/') }
      }
      node = node[part].__children
    }
  }

  function toArray(obj, prefix = '') {
    return Object.entries(obj)
      .filter(([k]) => !k.startsWith('__'))
      .sort(([a, na], [b, nb]) => {
        const aIsFile = na.__isFile
        const bIsFile = nb.__isFile
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
        return a.localeCompare(b)
      })
      .map(([name, node]) => ({
        name,
        path: node.__path,
        type: node.__isFile ? 'file' : 'folder',
        children: node.__isFile ? undefined : toArray(node.__children),
      }))
  }

  return toArray(root)
}

/**
 * Get file type for editor routing
 */
export function getFileType(path) {
  if (!path) return 'unknown'
  const name = path.split('/').pop()
  const ext  = name.split('.').pop()

  if (ext === 'mcfunction') return 'mcfunction'
  if (name === 'pack.mcmeta') return 'packmeta'
  if (name.endsWith('.nbt'))  return 'nbt'

  if (ext === 'json') {
    if (path.includes('/recipes/'))     return 'recipe'
    if (path.includes('/loot_tables/')) return 'loottable'
    if (path.includes('/advancements/'))return 'advancement'
    if (path.includes('/predicates/'))  return 'json'
    if (path.includes('/tags/'))        return 'json'
    if (path.includes('/lang/'))        return 'json'
    return 'json'
  }

  if (['.gitkeep',''].includes(name)) return 'hidden'
  return 'text'
}

export function getFileIcon(path) {
  const type = getFileType(path)
  const icons = {
    mcfunction: '⚡',
    packmeta:   '📦',
    recipe:     '🔨',
    loottable:  '🎲',
    advancement:'🏆',
    json:       '{ }',
    nbt:        '💾',
    text:       '📄',
    hidden:     '·',
    unknown:    '📄',
  }
  return icons[type] || '📄'
}

export function getFileLanguage(path) {
  const type = getFileType(path)
  if (type === 'mcfunction') return 'mcfunction'
  if (type === 'hidden') return 'plaintext'
  const ext = path.split('.').pop()
  if (ext === 'json' || ['recipe','loottable','advancement','packmeta','json'].includes(type)) return 'json'
  return 'plaintext'
}

export function isGitkeep(path) {
  return path.endsWith('.gitkeep')
}
