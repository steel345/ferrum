import React, { useState } from 'react'
import { MC_ITEMS } from '../../data/minecraftData'
import useStore from '../../store/useStore'
import McTexture from '../McTexture'
import { Search, Copy } from 'lucide-react'

export default function AssetBrowser() {
  const [search, setSearch] = useState('')
  const { activeTab, files, updateFile, showToast } = useStore()

  const filtered = MC_ITEMS.filter(item =>
    !search ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.label.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 300) // cap to avoid rendering 1255 items at once

  function insertAtCursor(itemId) {
    if (!activeTab || files[activeTab] === undefined) {
      showToast('Open a file first to insert', 'info')
      return
    }
    const content = files[activeTab]
    const newline = content.endsWith('\n') || content === '' ? '' : '\n'
    updateFile(activeTab, content + newline + itemId)
    showToast(`Inserted ${itemId}`, 'success')
  }

  function copyId(id) {
    navigator.clipboard.writeText(id)
    showToast(`Copied ${id}`, 'success')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #1a3050' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            className="input text-xs pl-7 py-1.5"
            placeholder={`Search ${MC_ITEMS.length} items & blocks…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs mb-2" style={{ color: '#334155' }}>
          {search ? `${filtered.length} results` : `Showing 300 of ${MC_ITEMS.length} — search to filter`}
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              className="asset-item group relative"
              onClick={() => copyId(item.id)}
              title={`${item.id}\nClick to copy · Double-click to insert`}
              onDoubleClick={() => insertAtCursor(item.id)}
            >
              <McTexture item={item} size={28} />
              <span style={{ fontSize: 9, color: '#64748b', wordBreak: 'break-all', textAlign: 'center', lineHeight: 1.2 }}>
                {item.label}
              </span>
              <div className="absolute inset-0 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(37,99,235,0.2)' }}>
                <Copy size={12} style={{ color: '#93c5fd' }} />
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: '#334155' }}>
            No items match "{search}"
          </div>
        )}
      </div>

      <div className="px-3 py-2 shrink-0 text-xs" style={{ borderTop: '1px solid #1a3050', color: '#334155' }}>
        Click = copy ID · Double-click = insert into file
      </div>
    </div>
  )
}
