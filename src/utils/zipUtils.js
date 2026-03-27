import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Export all files in the virtual filesystem as a ZIP.
 * If both a datapack and resourcepack are present, they're zipped together.
 */
export async function exportZip(fileMap, projectName = 'project') {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(fileMap)) {
    if (!path.endsWith('.gitkeep')) {
      zip.file(path, content)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(blob, `${projectName}.zip`)
}

/**
 * Export only the datapack folder.
 */
export async function exportDatapack(fileMap, projectName = 'datapack') {
  const zip = new JSZip()
  const prefix = `${projectName}_datapack`
  for (const [path, content] of Object.entries(fileMap)) {
    if (path.startsWith(prefix) && !path.endsWith('.gitkeep')) {
      zip.file(path.slice(prefix.length + 1), content)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(blob, `${projectName}_datapack.zip`)
}

/**
 * Export only the resourcepack folder.
 */
export async function exportResourcepack(fileMap, projectName = 'resourcepack') {
  const zip = new JSZip()
  const prefix = `${projectName}_resourcepack`
  for (const [path, content] of Object.entries(fileMap)) {
    if (path.startsWith(prefix) && !path.endsWith('.gitkeep')) {
      zip.file(path.slice(prefix.length + 1), content)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(blob, `${projectName}_resourcepack.zip`)
}

/**
 * Import a ZIP file and return a flat file map { path: content }.
 * Tries to detect whether it's a datapack, resourcepack, or combined.
 */
export async function importZip(file) {
  const zip = await JSZip.loadAsync(file)
  const files = {}

  const promises = []
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      promises.push(
        zipEntry.async('string').then(content => {
          files[relativePath] = content
        })
      )
    }
  })
  await Promise.all(promises)

  // Detect pack type
  const paths = Object.keys(files)
  const hasData   = paths.some(p => p.includes('/data/') || p === 'pack.mcmeta')
  const hasAssets = paths.some(p => p.includes('/assets/'))
  let packType = 'unknown'
  if (hasData && hasAssets) packType = 'combined'
  else if (hasData)         packType = 'datapack'
  else if (hasAssets)       packType = 'resourcepack'

  return { files, packType }
}

/**
 * Save a single file to the user's disk via download.
 */
export function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}
