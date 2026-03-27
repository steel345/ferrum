/**
 * electronBridge.js
 * Safe wrapper around window.electronAPI.
 * Works in both Electron (where window.electronAPI is injected by preload.js)
 * and plain browser environments (where it is undefined).
 */

export const isElectron =
  typeof window !== 'undefined' && !!window.electronAPI

export const electronAPI =
  typeof window !== 'undefined' && window.electronAPI
    ? window.electronAPI
    : null
