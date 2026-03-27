import React, { useState } from 'react'
import useStore from '../../store/useStore'
import { Plus, Upload, Info, X, Code, Eye, Zap, Cpu, Package, FolderOpen, Wrench, Globe, Box, Download, Link, RefreshCw } from 'lucide-react'

const ALL_FEATURES = [
  {
    icon: <Zap size={22} />,
    title: 'Visual Editors',
    desc: 'Edit recipes, loot tables, biomes, and pack metadata through intuitive drag & drop interfaces — no raw JSON needed.',
    color: '#fbbf24',
  },
  {
    icon: <Eye size={22} />,
    title: 'Live Previews',
    desc: 'See 3D models, biome landscapes, and tellraw text update in real time as you type. What you see is what players get.',
    color: '#34d399',
  },
  {
    icon: <Code size={22} />,
    title: 'Monaco Code Editor',
    desc: 'Full autocomplete, syntax highlighting, jump-to-definition, and cross-file references — the same editor that powers VS Code.',
    color: '#60a5fa',
  },
  {
    icon: <Globe size={22} />,
    title: 'Minecraft Integration',
    desc: 'Ferrum reads your local Minecraft install so items, blocks, tags, and commands are always accurate for your target version.',
    color: '#a78bfa',
  },
  {
    icon: <FolderOpen size={22} />,
    title: 'Asset Browsers',
    desc: 'Search and insert any item, block, or advancement instantly. Browse your entire resource library without leaving the editor.',
    color: '#f472b6',
  },
  {
    icon: <Wrench size={22} />,
    title: 'Automation Tools',
    desc: 'Generate scoreboard expressions, calculate display transforms, and craft items — then drag them straight into your code.',
    color: '#fb923c',
  },
  {
    icon: <Box size={22} />,
    title: 'NBT & World Editing',
    desc: 'Open level.dat, edit structure files, and manage world hotbar items. Replace your standalone NBT tools entirely.',
    color: '#38bdf8',
  },
  {
    icon: <Download size={22} />,
    title: 'Import & Export',
    desc: 'Drop in a ZIP and Ferrum detects the pack type. Export as ZIP, install directly into a world, or upload via built-in FTP.',
    color: '#4ade80',
  },
  {
    icon: <Link size={22} />,
    title: 'Linked Workspaces',
    desc: 'Datapack and resourcepack are linked together. Create both with one click, auto-paired and always in sync.',
    color: '#c084fc',
  },
  {
    icon: <RefreshCw size={22} />,
    title: 'Version Independent',
    desc: 'Ferrum adapts to any Minecraft version. Validation, syntax, and previews are always matched to your target version.',
    color: '#facc15',
  },
  {
    icon: <Plus size={22} />,
    title: 'One-Click Creation',
    desc: 'Instantly scaffold a new datapack or resourcepack with proper structure and pack.mcmeta — ready to code.',
    color: '#2dd4bf',
  },
  {
    icon: <Cpu size={22} />,
    title: 'Built-in AI',
    desc: 'Generate code from a prompt directly into your datapack. The AI understands Minecraft syntax, commands, and NBT.',
    color: '#e879f9',
  },
]

function MoreInfoModal({ onClose }) {
  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      style={{ zIndex: 2000 }}
    >
      <div
        className="fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0b1525',
          border: '1px solid #1a3050',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.9), 0 0 60px rgba(37,99,235,0.15)',
          padding: 32,
          width: 760,
          maxWidth: '92vw',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: '#60a5fa', letterSpacing: 1 }}>
              Features
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
              Everything Ferrum has built-in for your Minecraft development workflow.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ALL_FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background: '#060c18',
                border: '1px solid #1a3050',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ color: f.color, marginTop: 2, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              padding: '10px 28px',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WelcomeScreen() {
  const openDialog = useStore(s => s.openDialog)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-10 px-8"
      style={{ background: '#060c18' }}
    >
      {/* Big Minecraft-font title */}
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
            boxShadow: '0 0 40px rgba(37,99,235,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
          }}
        >
          🔩
        </div>

        {/* Name — big Minecraft font */}
        <h1
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 42,
            color: '#60a5fa',
            textShadow: '0 0 30px rgba(96,165,250,0.5), 3px 3px 0 #1e3a6b',
            letterSpacing: 4,
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          FERRUM
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#3b82f6',
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          MINECRAFT DATAPACK IDE
        </p>

        <p
          style={{
            color: '#64748b',
            fontSize: 13,
            textAlign: 'center',
            maxWidth: 460,
            lineHeight: 1.7,
            marginTop: 4,
          }}
        >
          Purpose-built for Minecraft datapack and resourcepack development.
          Visual editors, Monaco code editor, live previews, and built-in AI — all in one place.
        </p>
      </div>

      {/* Action buttons — bigger */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => openDialog('newProject')}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 0 24px rgba(37,99,235,0.5)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            padding: '14px 32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 36px rgba(37,99,235,0.8)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(37,99,235,0.5)'}
        >
          <Plus size={20} />
          New Project
        </button>

        <button
          onClick={() => openDialog('importExport')}
          style={{
            background: '#112240',
            border: '1px solid #1a3050',
            borderRadius: 10,
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: 16,
            padding: '14px 32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1a3050'; e.currentTarget.style.color = '#e2e8f0' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#112240'; e.currentTarget.style.color = '#94a3b8' }}
        >
          <Upload size={20} />
          Import ZIP
        </button>

        <button
          onClick={() => setShowInfo(true)}
          style={{
            background: '#0b1525',
            border: '1px solid #2563eb',
            borderRadius: 10,
            color: '#60a5fa',
            fontWeight: 600,
            fontSize: 16,
            padding: '14px 32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e3a6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0b1525' }}
        >
          <Info size={20} />
          More Info
        </button>
      </div>

      {/* Small feature hints */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 600,
        }}
      >
        {[
          { icon: <Code size={14} />, label: 'Monaco Editor' },
          { icon: <Cpu size={14} />, label: 'Built-in AI' },
          { icon: <Package size={14} />, label: 'Linked Workspace' },
          { icon: <Eye size={14} />, label: 'Live Preview' },
          { icon: <FolderOpen size={14} />, label: 'Asset Browser' },
          { icon: <Zap size={14} />, label: 'Visual Editors' },
        ].map(f => (
          <div
            key={f.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#334155',
              fontSize: 12,
            }}
          >
            <span style={{ color: '#1e40af' }}>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>

      <p style={{ color: '#1e3050', fontSize: 11 }}>
        Version Independent · Works with 1.13 → 1.21+
      </p>

      {/* More Info Modal */}
      {showInfo && <MoreInfoModal onClose={() => setShowInfo(false)} />}
    </div>
  )
}
