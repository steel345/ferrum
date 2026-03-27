import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { buildAndDownloadLaunchPackage } from '../../utils/minecraftLauncher'
import { isElectron, electronAPI } from '../../utils/electronBridge'

export default function ActivityBar() {
  const { project, files, showToast } = useStore()

  // ── Shared dialog state ──────────────────────────────────────────────────
  const [showDialog, setShowDialog]   = useState(false)
  const [status, setStatus]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [mcVersion, setMcVersion]     = useState('')

  // ── Electron-only state ──────────────────────────────────────────────────
  const [mcInfo, setMcInfo]           = useState(null)   // { found, mcDir, versions, javaPath }
  const [mcRunning, setMcRunning]     = useState(false)
  const [selectedVersion, setSelectedVersion] = useState('')

  // On mount in Electron, auto-detect Minecraft
  useEffect(() => {
    if (!isElectron || !electronAPI) return

    electronAPI.detectMinecraft().then(info => {
      setMcInfo(info)
      if (info && info.versions && info.versions.length > 0) {
        // Pre-select the version matching the project, or the first available
        const projectVer = project?.version
        const match = projectVer
          ? info.versions.find(v => v.startsWith(projectVer)) || info.versions[0]
          : info.versions[0]
        setSelectedVersion(match)
      }
    }).catch(() => {})

    // Listen for MC stop event
    electronAPI.onMcStopped((info) => {
      setMcRunning(false)
      setLoading(false)
      setStatus(`Minecraft stopped (exit code ${info?.code ?? '?'})`)
    })
  }, [])

  // Re-resolve version match when project changes
  useEffect(() => {
    if (!mcInfo || !mcInfo.versions) return
    const projectVer = project?.version
    if (projectVer && !selectedVersion.startsWith(projectVer)) {
      const match = mcInfo.versions.find(v => v.startsWith(projectVer))
      if (match) setSelectedVersion(match)
    }
  }, [project, mcInfo])

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleLaunch() {
    if (!project) { showToast('Open a project first', 'info'); return }
    setShowDialog(true)
    setDone(false)
    setStatus('')
    setMcVersion('')
  }

  // ── Web fallback: download ZIP ───────────────────────────────────────────
  async function downloadPackage() {
    setLoading(true)
    setDone(false)
    try {
      const ver = await buildAndDownloadLaunchPackage(project, files, msg => setStatus(msg))
      setMcVersion(ver)
      setDone(true)
    } catch (err) {
      setStatus('Error: ' + err.message)
      showToast('Launch package failed: ' + err.message, 'error')
    }
    setLoading(false)
  }

  // ── Electron: launch MC ──────────────────────────────────────────────────
  async function launchMinecraftElectron() {
    if (!electronAPI || !mcInfo || !mcInfo.found) return
    setLoading(true)
    setStatus('Starting Minecraft…')

    try {
      const result = await electronAPI.launchMinecraft({
        mcDir: mcInfo.mcDir,
        version: selectedVersion,
        datapackFiles: files,
        projectNamespace: project?.namespace || 'ferrum_pack',
        projectDatapackRoot: project?.datpackRoot || '',
      })

      if (result && result.success) {
        setMcRunning(true)
        setStatus(`Minecraft running (PID ${result.pid}) — check console for logs`)
        setLoading(false)
      } else {
        setStatus('Launch failed: ' + (result?.error || 'unknown error'))
        setLoading(false)
      }
    } catch (err) {
      setStatus('Error: ' + err.message)
      setLoading(false)
    }
  }

  // ── Electron: stop MC ────────────────────────────────────────────────────
  async function stopMinecraftElectron() {
    if (!electronAPI) return
    setStatus('Stopping Minecraft…')
    try {
      await electronAPI.stopMinecraft()
    } catch (err) {
      setStatus('Stop error: ' + err.message)
    }
    setMcRunning(false)
  }

  // ── Detected version label shown under play button ───────────────────────
  const detectedLabel = isElectron && mcInfo?.found && selectedVersion
    ? selectedVersion
    : null

  return (
    <>
      {/* ── Thin left bar ───────────────────────────────────────────────── */}
      <div style={{
        width: 44, flexShrink: 0,
        background: '#030609',
        borderRight: '1px solid #1a3050',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8, paddingBottom: 8,
        gap: 6, userSelect: 'none',
      }}>
        <div style={{ flex: 1 }} />

        {/* Running indicator dot */}
        {isElectron && mcRunning && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 8px #4ade80',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} title="Minecraft is running" />
        )}

        {/* Play button */}
        <button
          onClick={handleLaunch}
          title="Launch Minecraft test environment"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            cursor: project ? 'pointer' : 'not-allowed',
            background: mcRunning
              ? 'linear-gradient(135deg,#15803d,#166534)'
              : 'linear-gradient(135deg,#16a34a,#15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: mcRunning
              ? '0 0 14px rgba(74,222,128,0.6)'
              : '0 0 6px rgba(34,197,94,0.3)',
            transition: 'all 0.15s',
            opacity: project ? 1 : 0.35,
          }}
          onMouseEnter={e => { if (project) e.currentTarget.style.boxShadow = '0 0 18px rgba(34,197,94,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = mcRunning ? '0 0 14px rgba(74,222,128,0.6)' : '0 0 6px rgba(34,197,94,0.3)' }}
        >
          <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
            <polygon points="1,1 11,7 1,13" />
          </svg>
        </button>

        {/* MC version label under play button */}
        {detectedLabel && (
          <span style={{
            fontSize: 7, color: '#4ade80', letterSpacing: 0.3,
            maxWidth: 36, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', textAlign: 'center',
          }} title={detectedLabel}>
            {detectedLabel}
          </span>
        )}

        <span style={{
          fontSize: 8, color: '#1e3050', letterSpacing: 0.5,
          textTransform: 'uppercase', writingMode: 'vertical-rl',
          transform: 'rotate(180deg)', marginBottom: 4,
        }}>run</span>
      </div>

      {/* Pulse animation keyframes injected inline */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Launch dialog ───────────────────────────────────────────────── */}
      {showDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#07111f', border: '1px solid #1a3050',
            borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw',
            boxShadow: '0 0 60px rgba(37,99,235,0.2)',
          }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🎮</span>
              <div>
                <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Launch Minecraft Test Environment
                </h2>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                  for <span style={{ color: '#60a5fa' }}>{project?.name}</span>
                  {' · '}
                  {isElectron && mcInfo?.found
                    ? <span style={{ color: '#4ade80' }}>MC detected</span>
                    : <span>Minecraft {project?.version || '1.21'}</span>
                  }
                </p>
              </div>
            </div>

            {/* ── ELECTRON path ── */}
            {isElectron ? (
              <>
                {mcInfo && !mcInfo.found && (
                  <div style={{
                    background: '#1a0a0a', border: '1px solid #7f1d1d',
                    borderRadius: 10, padding: 14, marginBottom: 16,
                    color: '#fca5a5', fontSize: 12,
                  }}>
                    Minecraft installation not found. Make sure the official Minecraft Launcher is installed.
                  </div>
                )}

                {mcInfo && mcInfo.found && (
                  <div style={{
                    background: '#040810', border: '1px solid #1a3050',
                    borderRadius: 10, padding: 14, marginBottom: 16,
                  }}>
                    <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                      Minecraft detected
                    </div>
                    <div style={{ color: '#93c5fd', fontSize: 11, marginBottom: 6 }}>
                      Path: <span style={{ color: '#e2e8f0' }}>{mcInfo.mcDir}</span>
                    </div>
                    {mcInfo.javaPath && (
                      <div style={{ color: '#93c5fd', fontSize: 11, marginBottom: 10 }}>
                        Java: <span style={{ color: '#e2e8f0' }}>{mcInfo.javaPath}</span>
                      </div>
                    )}

                    {/* Version selector */}
                    <label style={{ color: '#93c5fd', fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Version to launch:
                    </label>
                    <select
                      value={selectedVersion}
                      onChange={e => setSelectedVersion(e.target.value)}
                      disabled={mcRunning}
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: 6,
                        background: '#07111f', border: '1px solid #1a3050',
                        color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {mcInfo.versions.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Running state */}
                {mcRunning && (
                  <div style={{
                    background: '#071a0e', border: '1px solid #166534',
                    borderRadius: 10, padding: 12, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#4ade80', boxShadow: '0 0 8px #4ade80',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      flexShrink: 0,
                    }} />
                    <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                      Minecraft is running — open console for logs
                    </span>
                  </div>
                )}

                {/* Status */}
                {status && (
                  <div style={{
                    background: '#040810', border: '1px solid #1a3050',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 16,
                    fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {loading && (
                      <span style={{
                        display: 'inline-block', width: 12, height: 12,
                        border: '2px solid rgba(96,165,250,0.3)', borderTop: '2px solid #60a5fa',
                        borderRadius: '50%', animation: 'spin 1s linear infinite',
                        flexShrink: 0,
                      }} />
                    )}
                    {status}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowDialog(false)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8,
                      background: 'transparent', border: '1px solid #1a3050',
                      color: '#64748b', fontSize: 13, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3050'}
                  >
                    Close
                  </button>

                  {mcRunning ? (
                    <button
                      onClick={stopMinecraftElectron}
                      style={{
                        flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      ⏹ Stop Minecraft
                    </button>
                  ) : (
                    <button
                      onClick={launchMinecraftElectron}
                      disabled={loading || !mcInfo?.found || !selectedVersion}
                      style={{
                        flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg,#16a34a,#15803d)',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: (loading || !mcInfo?.found) ? 'not-allowed' : 'pointer',
                        opacity: (loading || !mcInfo?.found) ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {loading ? (
                        <>
                          <span style={{
                            width: 13, height: 13,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white', borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }} />
                          Launching…
                        </>
                      ) : (
                        '▶ Launch Minecraft'
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ── WEB path (original download ZIP flow) ── */
              <>
                {!done && (
                  <div style={{
                    background: '#040810', border: '1px solid #1a3050',
                    borderRadius: 10, padding: 14, marginBottom: 16,
                  }}>
                    <p style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      ⚡ How it works — no Minecraft install required:
                    </p>
                    {[
                      '📦 Downloads a ZIP with a one-click server launcher',
                      '☕ Auto-downloads portable Java 21 if you don\'t have it',
                      '🟩 Downloads the official Minecraft server jar from Mojang (free)',
                      '📁 Installs your datapack into the test world automatically',
                      '🌐 Starts a local server on localhost:25565',
                      '🎮 Connect from any Minecraft client (or try for free with TLauncher)',
                    ].map((step, i) => (
                      <div key={i} style={{ color: '#64748b', fontSize: 11, lineHeight: 1.8 }}>{step}</div>
                    ))}
                  </div>
                )}

                {done && (
                  <div style={{
                    background: '#071a0e', border: '1px solid #166534',
                    borderRadius: 10, padding: 16, marginBottom: 16,
                  }}>
                    <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                      ✅ Launch package downloaded!
                    </p>
                    <div style={{ color: '#86efac', fontSize: 12, lineHeight: 2 }}>
                      <div>1. Extract the ZIP file</div>
                      <div>2. Double-click <code style={{ background: '#0f2e1b', padding: '1px 6px', borderRadius: 4 }}>launch_server.bat</code></div>
                      <div>3. Wait for the server to start (first time takes ~1 min)</div>
                      <div>4. Open Minecraft <strong>{mcVersion}</strong> → Multiplayer → <strong>localhost</strong></div>
                      <div>5. Type <code style={{ background: '#0f2e1b', padding: '1px 6px', borderRadius: 4 }}>/reload</code> in-game to reload the datapack</div>
                    </div>
                    <div style={{ marginTop: 12, padding: '8px 12px', background: '#0a1e10', borderRadius: 6, fontSize: 11, color: '#4ade80' }}>
                      💡 No account needed — the server runs in offline mode
                    </div>
                  </div>
                )}

                {status && !done && (
                  <div style={{
                    background: '#040810', border: '1px solid #1a3050',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 16,
                    fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {loading && (
                      <span style={{
                        display: 'inline-block', width: 12, height: 12,
                        border: '2px solid rgba(96,165,250,0.3)', borderTop: '2px solid #60a5fa',
                        borderRadius: '50%', animation: 'spin 1s linear infinite',
                      }} />
                    )}
                    {status}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowDialog(false)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8,
                      background: 'transparent', border: '1px solid #1a3050',
                      color: '#64748b', fontSize: 13, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1a3050'}
                  >
                    Close
                  </button>
                  <button
                    onClick={done ? () => setShowDialog(false) : downloadPackage}
                    disabled={loading}
                    style={{
                      flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                      background: done
                        ? 'linear-gradient(135deg,#15803d,#166534)'
                        : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          width: 13, height: 13,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white', borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        Generating…
                      </>
                    ) : done ? (
                      '✓ Done — Close'
                    ) : (
                      '⬇ Download Launch Package'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
