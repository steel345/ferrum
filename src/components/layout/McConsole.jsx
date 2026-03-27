import React, { useState, useEffect, useRef } from 'react'
import { isElectron, electronAPI } from '../../utils/electronBridge'

// Classify a log line for colour-coding
function classifyLine(line) {
  const lower = line.toLowerCase()
  if (
    lower.includes('error') ||
    lower.includes('exception') ||
    lower.includes('fatal') ||
    lower.includes('crash')
  ) return 'error'
  if (
    lower.includes('warn') ||
    lower.includes('warning')
  ) return 'warn'
  if (
    lower.includes('[info]') ||
    lower.includes('starting') ||
    lower.includes('[ferrum]')
  ) return 'info'
  return 'normal'
}

const LINE_COLORS = {
  error:  '#f87171',   // red-400
  warn:   '#fbbf24',   // amber-400
  info:   '#60a5fa',   // blue-400
  normal: '#cbd5e1',   // slate-300
}

export default function McConsole() {
  const [lines, setLines] = useState([])
  const bottomRef = useRef(null)

  // Only render in Electron
  if (!isElectron) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!electronAPI) return

    const handleLog = (line) => {
      setLines(prev => [...prev, line])
    }

    electronAPI.onMcLog(handleLog)

    // No way to remove the listener via the simple contextBridge wrapper,
    // but this is fine because the component lives for the app lifetime.
  }, [])

  // Auto-scroll to bottom whenever lines change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines])

  function handleClear() {
    setLines([])
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#030609',
      borderTop: '1px solid #1a3050',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderBottom: '1px solid #1a3050',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4ade80',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Minecraft Console
        </span>

        <button
          onClick={handleClear}
          title="Clear console"
          style={{
            background: 'transparent',
            border: '1px solid #1a3050',
            borderRadius: 5,
            color: '#64748b',
            fontSize: 11,
            padding: '2px 10px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#2563eb'
            e.currentTarget.style.color = '#93c5fd'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1a3050'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          Clear
        </button>
      </div>

      {/* Log output area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
        fontSize: 12,
        lineHeight: 1.7,
      }}>
        {lines.length === 0 ? (
          <div style={{ color: '#334155', fontStyle: 'italic', marginTop: 8 }}>
            No output yet — launch Minecraft to see logs
          </div>
        ) : (
          lines.map((line, i) => {
            const type = classifyLine(line)
            return (
              <div
                key={i}
                style={{
                  color: LINE_COLORS[type],
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {line}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
