import React, { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { buildFileTree, getFileIcon, getFileType, isGitkeep } from '../../utils/scaffoldUtils'
import { ChevronRight, ChevronDown, Plus, Trash2, FilePlus, FolderPlus, Edit3, Pencil } from 'lucide-react'

function FileIcon({ path }) {
  const type = getFileType(path)
  const colors = {
    mcfunction: '#fbbf24',
    recipe:     '#34d399',
    loottable:  '#a78bfa',
    advancement:'#fb923c',
    packmeta:   '#38bdf8',
    json:       '#94a3b8',
    nbt:        '#f472b6',
    text:       '#64748b',
    hidden:     '#1e3050',
  }
  return (
    <span style={{ color: colors[type] || '#64748b', fontSize: 11, fontFamily: 'monospace', minWidth: 16, textAlign: 'center' }}>
      {getFileIcon(path)}
    </span>
  )
}

function FolderIcon({ expanded, name }) {
  const color = name?.includes('_datapack') ? '#3b82f6' :
                name?.includes('_resourcepack') ? '#a855f7' :
                name === 'data' || name === 'assets' ? '#38bdf8' :
                name === 'functions' ? '#fbbf24' :
                name === 'recipes' ? '#34d399' :
                name === 'loot_tables' ? '#a78bfa' :
                name === 'advancements' ? '#fb923c' :
                '#64748b'

  return (
    <span style={{ color, fontSize: 13 }}>{expanded ? '📂' : '📁'}</span>
  )
}

function TreeNode({ node, depth }) {
  const { openFile, activeTab, sidebarExpanded, toggleFolder, deleteFile, createFile, renameFile, dirtyFiles } = useStore()
  const [contextMenu, setContextMenu] = useState(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)
  const [addingFile, setAddingFile] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const isExpanded = sidebarExpanded[node.path]
  const isActive   = activeTab === node.path
  const isDirty    = dirtyFiles[node.path]

  function handleClick() {
    if (node.type === 'folder') {
      toggleFolder(node.path)
    } else {
      openFile(node.path)
    }
  }

  function handleContextMenu(e) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function closeCtx() { setContextMenu(null) }

  function handleNewFile() {
    closeCtx()
    setAddingFile(true)
    setNewItemName('')
  }

  function handleNewFolder() {
    closeCtx()
    setAddingFolder(true)
    setNewItemName('')
  }

  function handleDelete() {
    closeCtx()
    if (node.type === 'file') deleteFile(node.path)
  }

  function handleRename() {
    closeCtx()
    setNewName(node.name)
    setRenaming(true)
  }

  function commitRename() {
    const trimmed = newName.trim()
    if (trimmed && trimmed !== node.name) {
      const parent = node.path.split('/').slice(0, -1).join('/')
      const newPath = parent ? `${parent}/${trimmed}` : trimmed
      renameFile(node.path, newPath)
    }
    setRenaming(false)
  }

  function commitAddFile() {
    if (newItemName.trim()) {
      const path = `${node.path}/${newItemName.trim()}`
      const ext = newItemName.split('.').pop()
      createFile(path, ext === 'json' ? '{\n  \n}\n' : ext === 'mcfunction' ? '# New function\n\n' : '')
    }
    setAddingFile(false)
  }

  function commitAddFolder() {
    if (newItemName.trim()) {
      const path = `${node.path}/${newItemName.trim()}/.gitkeep`
      createFile(path, '')
    }
    setAddingFolder(false)
  }

  if (isGitkeep(node.path)) return null

  return (
    <div>
      <div
        className={`tree-item ${isActive ? 'selected' : ''} ${isDirty ? 'dirty' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'folder' ? (
          <>
            <span style={{ color: '#64748b', fontSize: 10, marginRight: 1 }}>
              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </span>
            <FolderIcon expanded={isExpanded} name={node.name} />
          </>
        ) : (
          <>
            <span style={{ width: 11, display: 'inline-block' }} />
            <FileIcon path={node.path} />
          </>
        )}
        {renaming ? (
          <input
            autoFocus
            className="input text-xs py-0 px-1 h-5"
            style={{ flex: 1, minWidth: 0 }}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            onBlur={commitRename}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-xs" style={{ flex: 1 }}>{node.name}</span>
        )}
        {isDirty && <span className="text-blue-400 text-xs ml-1">●</span>}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={closeCtx} />
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 51 }}>
            {node.type === 'folder' && (
              <>
                <div className="context-menu-item" onClick={handleNewFile}>
                  <FilePlus size={13} /> New File
                </div>
                <div className="context-menu-item" onClick={handleNewFolder}>
                  <FolderPlus size={13} /> New Folder
                </div>
                <div className="context-menu-divider" />
              </>
            )}
            <div className="context-menu-item" onClick={handleRename}>
              <Pencil size={13} /> Rename
            </div>
            {node.type === 'file' && (
              <>
                <div className="context-menu-divider" />
                <div className="context-menu-item danger" onClick={handleDelete}>
                  <Trash2 size={13} /> Delete
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Expanded children */}
      {node.type === 'folder' && isExpanded && (
        <div>
          {/* Add file input */}
          {addingFile && (
            <div style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }} className="py-1">
              <input
                autoFocus
                className="input text-xs py-0.5 px-2 h-6 w-full"
                placeholder="filename.json"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitAddFile(); if (e.key === 'Escape') setAddingFile(false) }}
                onBlur={commitAddFile}
              />
            </div>
          )}
          {addingFolder && (
            <div style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }} className="py-1">
              <input
                autoFocus
                className="input text-xs py-0.5 px-2 h-6 w-full"
                placeholder="folder_name"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitAddFolder(); if (e.key === 'Escape') setAddingFolder(false) }}
                onBlur={commitAddFolder}
              />
            </div>
          )}
          {(node.children || []).map(child => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { files, project } = useStore()
  const tree = buildFileTree(files)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid #1a3050' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
          Explorer
        </span>
        {project && (
          <span className="text-xs" style={{ color: '#334155' }}>
            {Object.keys(files).filter(f => !f.endsWith('.gitkeep')).length} files
          </span>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map(node => (
          <TreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
