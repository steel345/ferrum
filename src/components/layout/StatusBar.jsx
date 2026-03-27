import React from 'react'
import useStore from '../../store/useStore'
import { getFileType } from '../../utils/scaffoldUtils'

export default function StatusBar() {
  const { project, activeTab, files, dirtyFiles, settings } = useStore()
  const isDirty = dirtyFiles[activeTab]
  const type    = getFileType(activeTab || '')
  const content = files[activeTab] || ''
  const lines   = content.split('\n').length

  const typeLabel = {
    mcfunction: 'MCFunction',
    recipe:     'Recipe JSON',
    loottable:  'Loot Table JSON',
    advancement:'Advancement JSON',
    packmeta:   'Pack Meta',
    json:       'JSON',
    nbt:        'NBT',
    text:       'Text',
    unknown:    '',
  }

  return (
    <div className="flex items-center justify-between px-4 h-6 shrink-0 text-xs select-none"
      style={{ background: '#2563eb', color: 'rgba(255,255,255,0.85)' }}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <span>🔩 Ferrum</span>
        {project && (
          <span style={{ opacity: 0.7 }}>
            {project.name} · {project.namespace}: · MC {project.version}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4" style={{ opacity: 0.85 }}>
        {activeTab && (
          <>
            {isDirty && <span style={{ color: '#bfdbfe' }}>● Unsaved</span>}
            <span>{typeLabel[type] || type}</span>
            <span>{lines} lines</span>
          </>
        )}
        <span>UTF-8</span>
        <span>Spaces: {settings.tabSize}</span>
      </div>
    </div>
  )
}
