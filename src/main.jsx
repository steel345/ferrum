import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loader } from '@monaco-editor/react'

// Pre-load Monaco from CDN in the background while the welcome screen shows,
// so the editor is already ready when the user creates their first project.
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' } })
loader.init().catch(() => { /* silently ignore preload errors */ })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
