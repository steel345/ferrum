import React from 'react'
import useStore from '../../store/useStore'
import AssetBrowser from '../browsers/AssetBrowser'
import AIPanel from '../ai/AIPanel'
import PreviewPanel from '../preview/PreviewPanel'
import { Layers, Cpu, Eye } from 'lucide-react'

const TABS = [
  { id: 'assets',  label: 'Assets',  icon: <Layers size={14} /> },
  { id: 'ai',      label: 'AI',      icon: <Cpu size={14} /> },
  { id: 'preview', label: 'Preview', icon: <Eye size={14} /> },
]

export default function RightPanel() {
  const { rightPanel, setRightPanel } = useStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 select-none" style={{ borderBottom: '1px solid #1a3050', background: '#040810' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setRightPanel(t.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: rightPanel === t.id ? '#e2e8f0' : '#64748b',
              borderBottom: rightPanel === t.id ? '2px solid #2563eb' : '2px solid transparent',
              background: rightPanel === t.id ? '#0b1525' : 'transparent',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {rightPanel === 'assets'  && <AssetBrowser />}
        {rightPanel === 'ai'      && <AIPanel />}
        {rightPanel === 'preview' && <PreviewPanel />}
      </div>
    </div>
  )
}
