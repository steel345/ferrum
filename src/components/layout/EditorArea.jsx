import React from 'react'
import useStore from '../../store/useStore'
import { X } from 'lucide-react'
import { getFileType, getFileIcon } from '../../utils/scaffoldUtils'
import CodeEditor from '../editors/CodeEditor'
import RecipeEditor from '../editors/RecipeEditor'
import LootTableEditor from '../editors/LootTableEditor'
import PackMetaEditor from '../editors/PackMetaEditor'

function TabBar() {
  const { openTabs, activeTab, setActiveTab, closeTab, dirtyFiles } = useStore()

  if (!openTabs.length) return null

  return (
    <div className="flex overflow-x-auto shrink-0 select-none"
      style={{ background: '#040810', borderBottom: '1px solid #1a3050', minHeight: 36 }}>
      {openTabs.map(tab => {
        const name = tab.path.split('/').pop()
        const isActive = tab.path === activeTab
        const isDirty  = dirtyFiles[tab.path]
        return (
          <div
            key={tab.path}
            className={`tab ${isActive ? 'active' : ''} ${isDirty ? 'dirty' : ''}`}
            style={{ maxWidth: 180 }}
            onClick={() => setActiveTab(tab.path)}
            title={tab.path}
          >
            <span style={{ fontSize: 11 }}>{getFileIcon(tab.path)}</span>
            <span className="truncate" style={{ maxWidth: 110, fontSize: 12 }}>{name}</span>
            <button
              className="ml-1 p-0.5 rounded hover:bg-white/10 shrink-0"
              style={{ color: '#64748b' }}
              onClick={e => { e.stopPropagation(); closeTab(tab.path) }}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function EmptyEditor() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#1e3050' }}>
      <span className="text-5xl">{ }</span>
      <p className="text-sm" style={{ color: '#334155' }}>Open a file from the explorer</p>
    </div>
  )
}

function EditorRouter({ path }) {
  const type = getFileType(path)

  if (type === 'recipe')    return <RecipeEditor path={path} />
  if (type === 'loottable') return <LootTableEditor path={path} />
  if (type === 'packmeta')  return <PackMetaEditor path={path} />

  // All other types → Monaco code editor
  return <CodeEditor path={path} />
}

export default function EditorArea() {
  const { openTabs, activeTab } = useStore()

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#060c18' }}>
      <TabBar />
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab
          ? <EditorRouter key={activeTab} path={activeTab} />
          : <EmptyEditor />
        }
      </div>
    </div>
  )
}
