import React, { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { Sparkles, Plus, Code, FileText, Zap, Paperclip, X, Image } from 'lucide-react'

const QUICK_PROMPTS = [
  { label: 'Loot table: dungeon chest',  prompt: 'Create a loot table JSON for a dungeon chest with weapons, food, and rare items' },
  { label: 'Recipe: custom sword',       prompt: 'Create a shaped crafting recipe for a custom sword using a blaze rod and netherite ingots' },
  { label: 'Function: kill all mobs',    prompt: 'Write an mcfunction that kills all hostile mobs in a 50 block radius of the player' },
  { label: 'Advancement: find biome',    prompt: 'Create an advancement JSON triggered when a player enters a lush caves biome' },
  { label: 'Score-based teleport',       prompt: 'Write mcfunction code that teleports players to spawn when their health score reaches 0' },
  { label: 'Tellraw welcome message',    prompt: 'Generate a colorful tellraw JSON for a welcome message when a player joins' },
  { label: 'Tag: custom blocks',         prompt: 'Create a block tag JSON listing common building blocks' },
  { label: 'Custom enchant effect',      prompt: 'Write mcfunction tick logic for a fire aura enchantment using scoreboard tags' },
]

const MODES = [
  { id: 'generate', label: 'Generate File',  icon: <Plus size={12} /> },
  { id: 'add',      label: 'Add to Current', icon: <Code size={12} /> },
  { id: 'explain',  label: 'Explain',        icon: <FileText size={12} /> },
  { id: 'fix',      label: 'Fix / Improve',  icon: <Zap size={12} /> },
]

// ── Free AI — routes through Electron IPC (no CORS) or Vite proxy in web ────
async function callFreeAI(systemPrompt, userMessage, attachedImage, onChunk) {
  if (attachedImage?.isImage) {
    onChunk('[Free AI does not support image uploads — switch to Claude AI]\n\n')
  }

  const sys = systemPrompt.slice(0, 2000)
  const usr = userMessage.slice(0, 4000)

  // ── Electron path: use Node.js in main process — zero CORS issues ──────────
  if (window.electronAPI?.freeAIRequest) {
    const result = await window.electronAPI.freeAIRequest({ systemPrompt: sys, userMessage: usr })
    if (!result.ok) {
      throw new Error(`Free AI error ${result.status || ''}${result.body ? ': ' + result.body : result.error || ''}`)
    }
    onChunk(result.text)
    return result.text
  }

  // ── Web path: Vite proxy to avoid CORS ────────────────────────────────────
  const res = await fetch('/pollinations-api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [
        { role: 'system', content: sys },
        { role: 'user',   content: usr },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Free AI error ${res.status}${body ? ': ' + body.slice(0, 150) : ''}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  onChunk(text)
  return text
}

// ── Claude AI (Anthropic API) ────────────────────────────────────────────────
async function callClaudeAI(apiKey, model, systemPrompt, userMessage, attachedImage, onChunk) {
  let content
  if (attachedImage) {
    const base64 = attachedImage.dataUrl.split(',')[1]
    const mediaType = attachedImage.dataUrl.split(';')[0].split(':')[1] || 'image/png'
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: userMessage },
    ]
  } else {
    content = userMessage
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `API error ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.delta?.text || ''
        full += delta
        onChunk(full)
      } catch {}
    }
  }
  return full
}

export default function AIPanel() {
  const { settings, updateSettings, activeTab, files, createFile, updateFile, showToast, project } = useStore()
  const [prompt, setPrompt]         = useState('')
  const [mode, setMode]             = useState('generate')
  const [targetPath, setTargetPath] = useState('')
  const [loading, setLoading]       = useState(false)
  const [response, setResponse]     = useState('')
  const [showKey, setShowKey]       = useState(false)
  const [attachment, setAttachment] = useState(null) // { name, dataUrl, isImage, isText, textContent }
  const fileInputRef = useRef(null)
  const responseRef  = useRef(null)
  const aiMode = settings.aiMode || 'free'

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight
  }, [response])

  useEffect(() => {
    if (mode !== 'generate' || !project) return
    const dp = project.datpackRoot
    const ns = project.namespace
    const base = `${dp}/data/${ns}`
    const p = prompt.toLowerCase()
    let guessed =
      /recipe|craft|smelt|furnace|shaped|shapeless/.test(p) ? `${base}/recipes/ai_recipe.json` :
      /loot.?table|loot|drop/.test(p)                       ? `${base}/loot_tables/ai_loot.json` :
      /advancement|achieve/.test(p)                         ? `${base}/advancements/ai_advancement.json` :
      /tag/.test(p)                                          ? `${base}/tags/items/ai_tag.json` :
      /biome/.test(p)                                        ? `${base}/worldgen/biome/ai_biome.json` :
      /dimension/.test(p)                                    ? `${base}/dimension/ai_dimension.json` :
      /predicate/.test(p)                                    ? `${base}/predicates/ai_predicate.json` :
      /function|mcfunction|command/.test(p)                  ? `${base}/functions/ai_function.mcfunction` :
      activeTab ? (() => { const parts = activeTab.split('/'); return parts.slice(0,-1).join('/') + '/ai_generated.json' })() :
      `${base}/functions/ai_generated.mcfunction`
    setTargetPath(guessed)
  }, [prompt, mode, project, activeTab])

  // ── File attachment handler ─────────────────────────────────────────────
  function handleFileAttach(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (isImage) {
        setAttachment({ name: file.name, dataUrl: ev.target.result, isImage: true })
      } else {
        setAttachment({ name: file.name, isText: true, textContent: ev.target.result })
      }
    }
    if (isImage) reader.readAsDataURL(file)
    else reader.readAsText(file)
    e.target.value = ''
  }

  // ── Auto-add texture to resourcepack ───────────────────────────────────
  function autoAddTexture(dataUrl, suggestedName) {
    if (!project) return
    const itemName = suggestedName
      ? suggestedName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      : 'custom_item'
    const texturePath = `${project.resourcepackRoot}/assets/${project.namespace}/textures/item/${itemName}.png`
    // Store as data URL — exportZip will handle it
    createFile(texturePath, dataUrl)
    showToast(`Texture added to resourcepack: ${itemName}.png`, 'success')
    return { itemName, texturePath }
  }

  // ── Build prompts ───────────────────────────────────────────────────────
  function buildPrompts() {
    const contextFile = (mode !== 'generate' && activeTab) ? files[activeTab] : null
    const attachNote  = attachment?.isText
      ? `\n\nAttached file (${attachment.name}):\n${attachment.textContent?.slice(0, 2000)}`
      : attachment?.isImage
        ? `\n\nThe user attached an image named "${attachment.name}". If it's a texture for a custom item, generate the appropriate item model JSON and reference it correctly in the resourcepack namespace "${project?.namespace || 'minecraft'}".`
        : ''

    const systemPrompt = `You are an expert Minecraft Java Edition datapack and resourcepack developer.
Generate valid, correct Minecraft JSON or mcfunction code.
Rules:
- Return ONLY raw code. No markdown fences, no explanations unless asked.
- Use correct Minecraft ${project?.version || '1.21'} syntax.
- Namespace: ${project?.namespace || 'minecraft'}
${mode === 'explain' ? 'Explain clearly. You may use markdown.' : ''}
${mode === 'fix' ? 'Return only the fixed code.' : ''}
${contextFile ? `\nCurrent file:\n${contextFile.slice(0, 3000)}` : ''}${attachNote}`

    const userMessage = mode === 'explain' || mode === 'fix'
      ? `${mode === 'explain' ? 'Explain' : 'Fix and improve'} this:\n\n${contextFile || 'No file open'}\n\nNotes: ${prompt}`
      : prompt

    return { systemPrompt, userMessage }
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  async function generate() {
    if (!prompt.trim()) return
    if (aiMode === 'claude' && !settings.aiApiKey) {
      showToast('Enter your Claude API key first', 'error')
      return
    }

    // If image attached and prompt mentions item/texture — auto-add texture
    let texInfo = null
    if (attachment?.isImage && /item|texture|custom|resource/i.test(prompt)) {
      texInfo = autoAddTexture(attachment.dataUrl, attachment.name)
    }

    const { systemPrompt, userMessage } = buildPrompts()
    setLoading(true)
    setResponse('')
    let fullText = ''

    try {
      const imageArg = attachment?.isImage ? attachment : null
      if (aiMode === 'free') {
        fullText = await callFreeAI(systemPrompt, userMessage, imageArg, t => setResponse(t))
      } else {
        fullText = await callClaudeAI(
          settings.aiApiKey, settings.aiModel || 'claude-sonnet-4-6',
          systemPrompt, userMessage, imageArg, t => setResponse(t),
        )
      }

      if (mode === 'generate' && targetPath && fullText.trim()) {
        createFile(targetPath, fullText.trim())
        showToast(`Created ${targetPath.split('/').pop()}`, 'success')
      } else if (mode === 'add' && activeTab && fullText.trim()) {
        const existing = files[activeTab] || ''
        updateFile(activeTab, existing + (existing.endsWith('\n') ? '' : '\n') + fullText.trim())
        showToast('Added to current file', 'success')
      } else if (mode === 'fix' && activeTab && fullText.trim()) {
        updateFile(activeTab, fullText.trim())
        showToast('File updated', 'success')
      }
    } catch (err) {
      setResponse(`Error: ${err.message}`)
      showToast('AI error: ' + err.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── AI Engine toggle (prominent) ── */}
      <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #1a3050' }}>
        <p className="label mb-2">AI Engine</p>
        <div style={{
          display: 'flex',
          background: '#040810',
          border: '1px solid #1a3050',
          borderRadius: 8,
          padding: 3,
          gap: 3,
        }}>
          <button
            onClick={() => updateSettings({ aiMode: 'free' })}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: aiMode === 'free' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent',
              color: aiMode === 'free' ? '#fff' : '#64748b',
              fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
            }}
          >
            🤖 Free AI
          </button>
          <button
            onClick={() => updateSettings({ aiMode: 'claude' })}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: aiMode === 'claude' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
              color: aiMode === 'claude' ? '#fff' : '#64748b',
              fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
            }}
          >
            ✦ Claude AI
          </button>
        </div>

        {aiMode === 'free' && (
          <p style={{ fontSize: 10, color: '#16a34a', marginTop: 5 }}>✓ No API key needed · Powered by GPT-4o</p>
        )}

        {aiMode === 'claude' && (
          <div style={{ marginTop: 8 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="label mb-0" style={{ fontSize: 10 }}>Claude API Key</p>
              <button style={{ fontSize: 10, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowKey(!showKey)}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
            <input type={showKey ? 'text' : 'password'} className="input text-xs py-1.5"
              placeholder="sk-ant-api03-..."
              value={settings.aiApiKey}
              onChange={e => updateSettings({ aiApiKey: e.target.value })} />
            {!settings.aiApiKey && (
              <p style={{ fontSize: 10, color: '#f97316', marginTop: 4 }}>⚠️ API key required</p>
            )}
            <select className="select text-xs w-full mt-2" value={settings.aiModel || 'claude-sonnet-4-6'}
              onChange={e => updateSettings({ aiModel: e.target.value })}>
              <option value="claude-opus-4-6">Claude Opus 4.6 — Best</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Fast</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — Fastest</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Mode selector */}
        <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #1a3050' }}>
          <p className="label mb-2">Mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left"
                style={{
                  background: mode === m.id ? '#1e3a6b' : '#0b1525',
                  border: `1px solid ${mode === m.id ? '#2563eb' : '#1a3050'}`,
                  color: mode === m.id ? '#93c5fd' : '#64748b', fontWeight: 600,
                }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target path */}
        {mode === 'generate' && (
          <div className="px-3 pt-3 shrink-0">
            <p className="label">Save to path</p>
            <input className="input text-xs py-1.5 font-mono" value={targetPath}
              onChange={e => setTargetPath(e.target.value)}
              placeholder="project_datapack/data/ns/recipes/file.json" />
          </div>
        )}

        {/* Quick prompts */}
        <div className="p-3 shrink-0">
          <p className="label">Quick Prompts</p>
          <div className="flex flex-col gap-1">
            {QUICK_PROMPTS.map(qp => (
              <button key={qp.label}
                className="text-left px-2 py-1.5 rounded text-xs transition-colors"
                style={{ color: '#64748b', border: '1px solid transparent', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0b1525'; e.currentTarget.style.borderColor = '#1a3050' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                onClick={() => setPrompt(qp.prompt)}>
                ✦ {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt + attach */}
        <div className="px-3 pb-3 shrink-0">
          <p className="label">Your Prompt</p>
          <textarea className="input text-xs resize-none" rows={3} value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              mode === 'generate' ? 'Describe what to create...' :
              mode === 'add'      ? 'What to add to the current file...' :
              mode === 'explain'  ? 'Questions about the file?' :
              'What to fix or improve...'
            }
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
          />

          {/* Attachment */}
          {attachment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
              background: '#0b1525', border: '1px solid #1a3050', borderRadius: 6, padding: '6px 10px',
            }}>
              {attachment.isImage ? <Image size={12} style={{ color: '#60a5fa' }} /> : <Paperclip size={12} style={{ color: '#60a5fa' }} />}
              <span style={{ fontSize: 11, color: '#93c5fd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachment.name}
              </span>
              {attachment.isImage && (
                <img src={attachment.dataUrl} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 3, imageRendering: 'pixelated' }} />
              )}
              <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {/* Attach file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file"
              style={{
                background: '#0b1525', border: '1px solid #1a3050', borderRadius: 6,
                color: '#64748b', cursor: 'pointer', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#93c5fd' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#64748b' }}
            >
              <Paperclip size={12} /> Attach
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,.json,.mcfunction,.txt" style={{ display: 'none' }} onChange={handleFileAttach} />

            {/* Generate button */}
            <button className="btn btn-primary text-sm" style={{ flex: 1 }}
              onClick={generate} disabled={loading || !prompt.trim()}
              style={{ flex: 1, opacity: loading || !prompt.trim() ? 0.6 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} />
                  Generating…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Sparkles size={13} />
                  Generate {aiMode === 'free' ? '(Free)' : '(Claude)'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        {response && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="label mb-0">Response</p>
              <div className="flex gap-1.5">
                <button className="btn btn-secondary text-xs py-0.5 px-2"
                  onClick={() => { navigator.clipboard.writeText(response); showToast('Copied!', 'success') }}>Copy</button>
                {mode !== 'generate' && activeTab && (
                  <button className="btn btn-secondary text-xs py-0.5 px-2"
                    onClick={() => { const ex = files[activeTab] || ''; updateFile(activeTab, ex + (ex.endsWith('\n') ? '' : '\n') + response.trim()); showToast('Inserted', 'success') }}>Insert</button>
                )}
                {mode === 'generate' && targetPath && (
                  <button className="btn btn-primary text-xs py-0.5 px-2"
                    onClick={() => { createFile(targetPath, response.trim()); showToast(`Created ${targetPath.split('/').pop()}`, 'success') }}>Save File</button>
                )}
              </div>
            </div>
            <div ref={responseRef} className="ai-stream rounded-lg p-3 overflow-y-auto"
              style={{ background: '#040810', border: '1px solid #1a3050', maxHeight: 260, minHeight: 60 }}>
              {response}
              {loading && <span style={{ display: 'inline-block', width: 6, height: 16, background: '#60a5fa', marginLeft: 2, animation: 'glowPulse 1s infinite' }} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
