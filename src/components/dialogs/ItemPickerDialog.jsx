import React, { useState } from 'react'
import useStore from '../../store/useStore'
import { MC_ITEMS, MC_ITEM_CATEGORIES } from '../../data/minecraftData'
import { X, Search } from 'lucide-react'

export default function ItemPickerDialog() {
  const { closeItemPicker, pickItem } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const cats = ['All', ...MC_ITEM_CATEGORIES]

  const filtered = MC_ITEMS.filter(item => {
    const matchCat = category === 'All' || item.cat === category
    const matchSearch = !search ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="dialog-overlay" onClick={closeItemPicker}>
      <div className="dialog fade-in" style={{ width: 520, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a3050' }}>
          <h2 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Select Item</h2>
          <button className="btn btn-ghost p-1" onClick={closeItemPicker}><X size={14} /></button>
        </div>

        {/* Search */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid #1a3050' }}>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
            <input
              autoFocus
              className="input text-xs pl-7 py-1.5"
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto px-2 py-1.5 gap-1" style={{ borderBottom: '1px solid #1a3050' }}>
          {cats.map(c => (
            <button key={c}
              onClick={() => setCategory(c)}
              className="px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 transition-colors"
              style={{ background: category === c ? '#2563eb' : 'transparent', color: category === c ? '#fff' : '#64748b' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-3" style={{ maxHeight: 360 }}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {filtered.map(item => (
              <button
                key={item.id}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={item.id}
                onClick={() => pickItem(item.id)}
              >
                <span className="text-2xl leading-none">{item.emoji}</span>
                <span style={{ fontSize: 9, color: '#64748b', wordBreak: 'break-all', textAlign: 'center', lineHeight: 1.2 }}>
                  {item.label.length > 14 ? item.label.slice(0, 13) + '…' : item.label}
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <p className="text-center py-8 text-xs" style={{ color: '#334155' }}>No items match "{search}"</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-2" style={{ borderTop: '1px solid #1a3050' }}>
          <span className="text-xs" style={{ color: '#334155' }}>{filtered.length} items</span>
          <button className="btn btn-secondary text-xs py-1 px-3" onClick={closeItemPicker}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
