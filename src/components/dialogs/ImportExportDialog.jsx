import React, { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import { X, Upload, Download, Package, Layers, FileArchive } from 'lucide-react'
import { importZip, exportZip, exportDatapack, exportResourcepack } from '../../utils/zipUtils'

export default function ImportExportDialog() {
  const { closeDialog, project, files, importFiles, showToast } = useStore()
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.zip')) {
      showToast('Please select a ZIP file', 'error')
      return
    }
    setImporting(true)
    try {
      const { files: newFiles, packType } = await importZip(file)
      setImportResult({ files: newFiles, packType, name: file.name, count: Object.keys(newFiles).length })
    } catch (e) {
      showToast('Import failed: ' + e.message, 'error')
    }
    setImporting(false)
  }

  function confirmImport() {
    if (!importResult) return
    importFiles(importResult.files)
    closeDialog('importExport')
  }

  async function handleExport(type) {
    if (!project) return
    try {
      if (type === 'all')        await exportZip(files, project.name)
      else if (type === 'dp')    await exportDatapack(files, project.name)
      else if (type === 'rp')    await exportResourcepack(files, project.name)
      showToast('Exported!', 'success')
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error')
    }
  }

  return (
    <div className="dialog-overlay" onClick={() => closeDialog('importExport')}>
      <div className="dialog fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="dialog-title">Import / Export</h2>
            <p className="dialog-subtitle mb-0">Import a ZIP pack or export your project</p>
          </div>
          <button className="btn btn-ghost p-1.5" onClick={() => closeDialog('importExport')}><X size={16} /></button>
        </div>

        {/* Import section */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
            <Upload size={12} className="inline mr-1.5" />Import
          </h3>

          {/* Drop zone */}
          {!importResult ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragging ? '#2563eb' : '#1a3050'}`,
                background: dragging ? 'rgba(37,99,235,0.05)' : '#0a1220',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".zip" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
              <FileArchive size={32} style={{ color: dragging ? '#3b82f6' : '#334155' }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                  {importing ? 'Reading ZIP…' : 'Drop a ZIP file here'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  or click to browse · Supports datapack, resourcepack, or combined ZIPs
                </p>
              </div>
              {importing && <span className="spin inline-block w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full" />}
            </div>
          ) : (
            <div className="p-4 rounded-xl" style={{ background: '#0a1220', border: '1px solid #16a34a' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{importResult.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    {importResult.count} files detected · Type: {importResult.packType}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary text-sm flex-1" onClick={confirmImport}>
                  ✓ Import {importResult.count} files
                </button>
                <button className="btn btn-secondary text-sm" onClick={() => setImportResult(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Export section */}
        {project && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
              <Download size={12} className="inline mr-1.5" />Export
            </h3>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5"
                style={{ border: '1px solid #1a3050' }}
                onClick={() => handleExport('all')}>
                <Package size={18} style={{ color: '#3b82f6' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Export Complete Project</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Both datapack and resourcepack in one ZIP</p>
                </div>
                <Download size={14} className="ml-auto" style={{ color: '#64748b' }} />
              </button>
              <button className="flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5"
                style={{ border: '1px solid #1a3050' }}
                onClick={() => handleExport('dp')}>
                <Layers size={18} style={{ color: '#3b82f6' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Datapack Only</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{project.name}_datapack.zip</p>
                </div>
                <Download size={14} className="ml-auto" style={{ color: '#64748b' }} />
              </button>
              <button className="flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5"
                style={{ border: '1px solid #1a3050' }}
                onClick={() => handleExport('rp')}>
                <Layers size={18} style={{ color: '#a855f7' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Resourcepack Only</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{project.name}_resourcepack.zip</p>
                </div>
                <Download size={14} className="ml-auto" style={{ color: '#64748b' }} />
              </button>

              {/* Coming soon: world install, FTP */}
              <div className="mt-1 p-3 rounded-lg" style={{ background: '#0a1220', border: '1px solid #1a3050' }}>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  🔒 <strong style={{ color: '#94a3b8' }}>Coming in desktop version:</strong>{' '}
                  Install directly into a Minecraft world · FTP upload to server · Read local Minecraft install
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-end mt-6">
          <button className="btn btn-secondary" onClick={() => closeDialog('importExport')}>Close</button>
        </div>
      </div>
    </div>
  )
}
