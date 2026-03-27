// ── Minecraft Versions + Pack Formats ──────────────────────────────────────
export const MC_VERSIONS = [
  { id: '1.21.4', label: '1.21.4', datapack: 61, resourcepack: 46 },
  { id: '1.21.3', label: '1.21.3', datapack: 57, resourcepack: 42 },
  { id: '1.21.2', label: '1.21.2', datapack: 57, resourcepack: 42 },
  { id: '1.21.1', label: '1.21.1', datapack: 48, resourcepack: 34 },
  { id: '1.21',   label: '1.21',   datapack: 48, resourcepack: 34 },
  { id: '1.20.6', label: '1.20.6', datapack: 41, resourcepack: 32 },
  { id: '1.20.5', label: '1.20.5', datapack: 41, resourcepack: 32 },
  { id: '1.20.4', label: '1.20.4', datapack: 26, resourcepack: 22 },
  { id: '1.20.3', label: '1.20.3', datapack: 26, resourcepack: 22 },
  { id: '1.20.2', label: '1.20.2', datapack: 18, resourcepack: 18 },
  { id: '1.20.1', label: '1.20.1', datapack: 15, resourcepack: 15 },
  { id: '1.20',   label: '1.20',   datapack: 15, resourcepack: 15 },
  { id: '1.19.4', label: '1.19.4', datapack: 12, resourcepack: 12 },
  { id: '1.19.3', label: '1.19.3', datapack: 10, resourcepack: 12 },
  { id: '1.19.2', label: '1.19.2', datapack: 10, resourcepack:  9 },
  { id: '1.19',   label: '1.19',   datapack: 10, resourcepack:  9 },
  { id: '1.18.2', label: '1.18.2', datapack:  9, resourcepack:  8 },
  { id: '1.18',   label: '1.18',   datapack:  8, resourcepack:  8 },
  { id: '1.17.1', label: '1.17.1', datapack:  7, resourcepack:  7 },
  { id: '1.17',   label: '1.17',   datapack:  7, resourcepack:  7 },
  { id: '1.16.5', label: '1.16.5', datapack:  6, resourcepack:  6 },
  { id: '1.16',   label: '1.16',   datapack:  6, resourcepack:  6 },
  { id: '1.15',   label: '1.15',   datapack:  5, resourcepack:  5 },
  { id: '1.14',   label: '1.14',   datapack:  4, resourcepack:  4 },
  { id: '1.13',   label: '1.13',   datapack:  4, resourcepack:  4 },
]

import { ALL_MC_ITEMS } from './allItems.js'

// MC_ITEMS � full list of 1255 items with real PNG textures
export const MC_ITEMS = ALL_MC_ITEMS.filter(i => i.id !== 'minecraft:air')
export const MC_ITEM_CATEGORIES = []

// ── Biomes ─────────────────────────────────────────────────────────────────
export const MC_BIOMES = [
  'minecraft:plains','minecraft:forest','minecraft:birch_forest','minecraft:dark_forest',
  'minecraft:taiga','minecraft:snowy_taiga','minecraft:old_growth_pine_taiga',
  'minecraft:old_growth_spruce_taiga','minecraft:snowy_plains','minecraft:ice_spikes',
  'minecraft:desert','minecraft:savanna','minecraft:savanna_plateau','minecraft:windswept_savanna',
  'minecraft:jungle','minecraft:sparse_jungle','minecraft:bamboo_jungle',
  'minecraft:badlands','minecraft:wooded_badlands','minecraft:eroded_badlands',
  'minecraft:meadow','minecraft:grove','minecraft:snowy_slopes','minecraft:frozen_peaks',
  'minecraft:jagged_peaks','minecraft:stony_peaks','minecraft:stony_shore',
  'minecraft:beach','minecraft:snowy_beach','minecraft:mushroom_fields',
  'minecraft:ocean','minecraft:deep_ocean','minecraft:cold_ocean','minecraft:deep_cold_ocean',
  'minecraft:frozen_ocean','minecraft:deep_frozen_ocean','minecraft:lukewarm_ocean',
  'minecraft:deep_lukewarm_ocean','minecraft:warm_ocean',
  'minecraft:river','minecraft:frozen_river','minecraft:swamp','minecraft:mangrove_swamp',
  'minecraft:nether_wastes','minecraft:soul_sand_valley','minecraft:crimson_forest',
  'minecraft:warped_forest','minecraft:basalt_deltas','minecraft:the_end',
  'minecraft:small_end_islands','minecraft:end_midlands','minecraft:end_highlands',
  'minecraft:end_barrens','minecraft:the_void','minecraft:dripstone_caves',
  'minecraft:lush_caves','minecraft:deep_dark','minecraft:cherry_grove',
]

// ── Entities ────────────────────────────────────────────────────────────────
export const MC_ENTITIES = [
  'minecraft:player','minecraft:zombie','minecraft:skeleton','minecraft:creeper',
  'minecraft:spider','minecraft:cave_spider','minecraft:enderman','minecraft:witch',
  'minecraft:blaze','minecraft:wither_skeleton','minecraft:ghast','minecraft:magma_cube',
  'minecraft:slime','minecraft:phantom','minecraft:drowned','minecraft:husk',
  'minecraft:stray','minecraft:pillager','minecraft:vindicator','minecraft:evoker',
  'minecraft:ravager','minecraft:vex','minecraft:warden','minecraft:elder_guardian',
  'minecraft:guardian','minecraft:shulker','minecraft:silverfish','minecraft:endermite',
  'minecraft:pig','minecraft:cow','minecraft:sheep','minecraft:chicken','minecraft:horse',
  'minecraft:donkey','minecraft:mule','minecraft:rabbit','minecraft:wolf','minecraft:cat',
  'minecraft:ocelot','minecraft:fox','minecraft:panda','minecraft:polar_bear',
  'minecraft:bee','minecraft:goat','minecraft:frog','minecraft:tadpole','minecraft:allay',
  'minecraft:sniffer','minecraft:camel','minecraft:armadillo','minecraft:breeze',
  'minecraft:villager','minecraft:wandering_trader','minecraft:iron_golem','minecraft:snow_golem',
  'minecraft:bat','minecraft:squid','minecraft:glow_squid','minecraft:axolotl','minecraft:dolphin',
  'minecraft:cod','minecraft:salmon','minecraft:tropical_fish','minecraft:pufferfish',
  'minecraft:turtle','minecraft:boat','minecraft:chest_boat','minecraft:minecart',
  'minecraft:chest_minecart','minecraft:hopper_minecart','minecraft:tnt_minecart',
  'minecraft:item','minecraft:xp_orb','minecraft:arrow','minecraft:fireball',
  'minecraft:falling_block','minecraft:ender_dragon','minecraft:wither',
]

// ── Effects ─────────────────────────────────────────────────────────────────
export const MC_EFFECTS = [
  'minecraft:speed','minecraft:slowness','minecraft:haste','minecraft:mining_fatigue',
  'minecraft:strength','minecraft:instant_health','minecraft:instant_damage',
  'minecraft:jump_boost','minecraft:nausea','minecraft:regeneration','minecraft:resistance',
  'minecraft:fire_resistance','minecraft:water_breathing','minecraft:invisibility',
  'minecraft:blindness','minecraft:night_vision','minecraft:hunger','minecraft:weakness',
  'minecraft:poison','minecraft:wither','minecraft:health_boost','minecraft:absorption',
  'minecraft:saturation','minecraft:glowing','minecraft:levitation','minecraft:luck',
  'minecraft:bad_luck','minecraft:slow_falling','minecraft:conduit_power',
  'minecraft:dolphins_grace','minecraft:bad_omen','minecraft:hero_of_the_village',
  'minecraft:darkness',
]

// ── mcfunction command keywords for Monaco ──────────────────────────────────
export const MC_COMMANDS = [
  'advancement','attribute','ban','ban-ip','banlist','bossbar','clear','clone',
  'data','datapack','debug','defaultgamemode','deop','difficulty','effect',
  'enchant','execute','experience','fill','fillbiome','forceload','function',
  'gamemode','gamerule','give','help','item','kick','kill','list','locate',
  'loot','me','msg','op','pardon','pardon-ip','particle','perf','place',
  'playsound','publish','recipe','reload','return','ride','save-all',
  'save-off','save-on','say','schedule','scoreboard','seed','setblock',
  'setidletimeout','setworldspawn','spawnpoint','spectate','spreadplayers',
  'stop','stopsound','summon','tag','team','teammsg','teleport','tell',
  'tellraw','time','title','tm','tp','trigger','warden_spawn_egg','weather',
  'whitelist','worldborder','xp',
  // execute sub-commands
  'as','at','if','unless','run','in','positioned','rotated','facing',
  'anchored','store','align','on','summon','result','success',
]

// ── Default file templates ───────────────────────────────────────────────────
export const FILE_TEMPLATES = {
  mcfunction: `# Function file\n# Author: {author}\n\n`,
  recipe_shaped: {
    type: 'minecraft:crafting_shaped',
    pattern: ['###', '# #', '###'],
    key: { '#': { item: 'minecraft:air' } },
    result: { item: 'minecraft:stone', count: 1 },
  },
  recipe_shapeless: {
    type: 'minecraft:crafting_shapeless',
    ingredients: [],
    result: { item: 'minecraft:stone', count: 1 },
  },
  recipe_smelting: {
    type: 'minecraft:smelting',
    ingredient: { item: 'minecraft:iron_ore' },
    result: 'minecraft:iron_ingot',
    experience: 0.7,
    cookingtime: 200,
  },
  loot_table: {
    type: 'minecraft:chest',
    pools: [{
      rolls: { min: 1, max: 3 },
      entries: [{
        type: 'minecraft:item',
        name: 'minecraft:diamond',
        weight: 1,
        functions: [{ function: 'minecraft:set_count', count: { min: 1, max: 3 } }],
      }],
    }],
  },
  advancement: {
    display: {
      icon: { item: 'minecraft:diamond' },
      title: { translate: 'advancements.custom.title' },
      description: { translate: 'advancements.custom.description' },
    },
    criteria: { trigger: { trigger: 'minecraft:impossible' } },
  },
  predicate: [{ condition: 'minecraft:random_chance', chance: 0.5 }],
  pack_mcmeta_data: (description, format) => ({
    pack: { pack_format: format, description },
  }),
  pack_mcmeta_res: (description, format) => ({
    pack: { pack_format: format, description },
  }),
  tag: { values: [] },
  dimension_type: {
    ultrawarm: false, natural: true, piglin_safe: false,
    respawn_anchor_works: false, bed_works: true, has_raids: true,
    has_skylight: true, has_ceiling: false, coordinate_scale: 1,
    ambient_light: 0, logical_height: 384, infiniburn: '#minecraft:infiniburn_overworld',
    effects: 'minecraft:overworld', min_y: -64, height: 384, monster_spawn_light_level: 0,
    monster_spawn_block_light_limit: 0,
  },
}
