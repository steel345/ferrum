import React from 'react'
import Editor from '@monaco-editor/react'
import useStore from '../../store/useStore'
import { getFileLanguage } from '../../utils/scaffoldUtils'
import { MC_COMMANDS, MC_ITEMS, MC_ENTITIES, MC_EFFECTS, MC_BIOMES } from '../../data/minecraftData'

// ── Monaco one-time setup (runs via beforeMount, before editor is created) ──
let monacoReady = false

function setupMonaco(monaco) {
  if (monacoReady) return
  monacoReady = true

  // Define custom dark-blue theme BEFORE the editor renders
  monaco.editor.defineTheme('ferrum-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',   foreground: '3b4d6b', fontStyle: 'italic' },
      { token: 'keyword',   foreground: '60a5fa' },
      { token: 'command',   foreground: '93c5fd' },
      { token: 'selector',  foreground: 'fb923c' },
      { token: 'string',    foreground: '34d399' },
      { token: 'number',    foreground: 'fbbf24' },
      { token: 'namespace', foreground: 'a78bfa' },
      { token: 'tag',       foreground: 'f472b6' },
      { token: 'nbt',       foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background':                     '#060c18',
      'editor.foreground':                     '#e2e8f0',
      'editor.lineHighlightBackground':        '#0d1829',
      'editor.selectionBackground':            '#1e3a6b',
      'editor.inactiveSelectionBackground':    '#1a2d4f',
      'editorLineNumber.foreground':           '#2d4a7a',
      'editorLineNumber.activeForeground':     '#3b82f6',
      'editorCursor.foreground':               '#3b82f6',
      'editorIndentGuide.background':          '#0d1829',
      'editorIndentGuide.activeBackground':    '#1e3050',
      'editorWidget.background':               '#0b1525',
      'editorWidget.border':                   '#1a3050',
      'editorSuggestWidget.background':        '#0b1525',
      'editorSuggestWidget.border':            '#1a3050',
      'editorSuggestWidget.selectedBackground':'#1e3a6b',
      'list.hoverBackground':                  '#112240',
      'list.activeSelectionBackground':        '#1e3a6b',
      'scrollbarSlider.background':            '#1a3050',
      'scrollbarSlider.hoverBackground':       '#2563eb',
      'minimap.background':                    '#040810',
    },
  })

  // Register mcfunction language
  monaco.languages.register({ id: 'mcfunction' })

  monaco.languages.setMonarchTokensProvider('mcfunction', {
    tokenizer: {
      root: [
        [/^\s*#.*$/,                                    'comment'],
        [/@[aeprs](?:\[.*?\])?/,                        'selector'],
        [/[a-z_]+:[a-z0-9_/.\-]+/,                     'namespace'],
        [/\$[a-zA-Z_][a-zA-Z0-9_]*/,                   'tag'],
        [/"[^"]*"/,                                     'string'],
        [/'[^']*'/,                                     'string'],
        [/\{[^}]*\}/,                                   'nbt'],
        [/-?[0-9]+(\.[0-9]+)?[bBsSlLfFdD]?/,           'number'],
        [/~-?[0-9]*(\.[0-9]+)?/,                        'number'],
        [/\^-?[0-9]*(\.[0-9]+)?/,                       'number'],
        [new RegExp(`\\b(${MC_COMMANDS.join('|')})\\b`), 'keyword'],
        [/[a-zA-Z_][a-zA-Z0-9_]*/,                     'command'],
      ],
    },
  })

  monaco.languages.setLanguageConfiguration('mcfunction', {
    comments: { lineComment: '#' },
    brackets: [['[', ']'], ['{', '}'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
  })

  // Autocomplete suggestions
  const allSuggestions = [
    ...MC_COMMANDS.map(c => ({
      label: c, kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: c, detail: 'Command',
    })),
    ...MC_ITEMS.map(i => ({
      label: i.id, kind: monaco.languages.CompletionItemKind.Value,
      insertText: i.id, detail: i.label + ' (item)',
    })),
    ...MC_ENTITIES.map(e => ({
      label: e, kind: monaco.languages.CompletionItemKind.Class,
      insertText: e, detail: 'Entity',
    })),
    ...MC_EFFECTS.map(ef => ({
      label: ef, kind: monaco.languages.CompletionItemKind.Enum,
      insertText: ef, detail: 'Effect',
    })),
    ...MC_BIOMES.map(b => ({
      label: b, kind: monaco.languages.CompletionItemKind.Module,
      insertText: b, detail: 'Biome',
    })),
    ...['@a', '@e', '@p', '@r', '@s'].map(s => ({
      label: s, kind: monaco.languages.CompletionItemKind.Operator,
      insertText: s, detail: 'Selector',
    })),
    {
      label: 'execute as ... run',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'execute as ${1:@a} at ${2:@s} run ${3:say hi}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Execute as target',
    },
    {
      label: 'scoreboard objectives add',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'scoreboard objectives add ${1:name} ${2:dummy} "${3:Display Name}"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Add scoreboard objective',
    },
    {
      label: 'execute if score',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'execute if score ${1:@s} ${2:score} matches ${3:1..} run ${4:}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Scoreboard condition',
    },
    {
      label: 'tellraw @a',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'tellraw @a {"text":"${1:Hello World}","color":"${2:white}"}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Tellraw message',
    },
    {
      label: 'title @a title',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'title @a title {"text":"${1:Title}","color":"${2:gold}","bold":true}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Show title',
    },
  ]

  monaco.languages.registerCompletionItemProvider('mcfunction', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      }
      return { suggestions: allSuggestions.map(s => ({ ...s, range })) }
    },
  })

  // JSON schema for pack.mcmeta
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{
      uri: 'pack.mcmeta',
      fileMatch: ['*pack.mcmeta*'],
      schema: {
        type: 'object',
        properties: {
          pack: {
            type: 'object',
            required: ['pack_format', 'description'],
            properties: {
              pack_format: { type: 'integer', minimum: 4 },
              description: { type: ['string', 'object'] },
              supported_formats: {
                oneOf: [
                  { type: 'integer' },
                  { type: 'object', properties: { min_inclusive: { type: 'integer' }, max_inclusive: { type: 'integer' } } },
                ],
              },
            },
          },
        },
      },
    }],
  })
}

function EditorLoading() {
  return (
    <div style={{
      height: '100%', width: '100%', background: '#060c18',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid #1a3050',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#334155', fontSize: 12 }}>Loading editor…</span>
    </div>
  )
}

export default function CodeEditor({ path }) {
  const { files, updateFile, saveFile, settings } = useStore()
  const content = files[path] ?? ''
  const language = getFileLanguage(path)

  // beforeMount: define theme BEFORE the editor instance is created
  function handleBeforeMount(monaco) {
    setupMonaco(monaco)
  }

  // onMount: editor instance is ready — wire up Ctrl+S and focus
  function handleMount(editor, monaco) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile(path)
    })
    editor.focus()
  }

  function handleChange(value) {
    if (value !== undefined) updateFile(path, value)
  }

  return (
    <div style={{ height: '100%', width: '100%', background: '#060c18' }}>
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="ferrum-dark"
        loading={<EditorLoading />}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontSize:                settings.fontSize,
          tabSize:                 settings.tabSize,
          wordWrap:                settings.wordWrap ? 'on' : 'off',
          minimap:                 { enabled: true },
          scrollBeyondLastLine:    false,
          renderLineHighlight:     'all',
          lineNumbers:             'on',
          glyphMargin:             true,
          folding:                 true,
          suggest:                 { showIcons: true },
          quickSuggestions:        { other: true, comments: false, strings: true },
          autoIndent:              'full',
          formatOnType:            true,
          formatOnPaste:           true,
          smoothScrolling:         true,
          cursorBlinking:          'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides:                  { bracketPairs: true, indentation: true },
          padding:                 { top: 8, bottom: 8 },
          fontLigatures:           true,
          fontFamily:              '"JetBrains Mono", "Fira Code", monospace',
        }}
      />
    </div>
  )
}
