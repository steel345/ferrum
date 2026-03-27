/**
 * Renders a real Minecraft item texture from public/mc-textures/.
 * Falls back to a coloured box with the first letter if the image 404s.
 */
import React, { useState } from 'react'

export default function McTexture({ item, size = 24, style = {} }) {
  const [failed, setFailed] = useState(false)
  const tex = item?.tex
  const label = item?.label || ''
  const initial = label.charAt(0).toUpperCase() || '?'

  if (!failed && tex) {
    return (
      <img
        src={`/mc-textures/${tex}`}
        alt={label}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
          objectFit: 'contain',
          ...style,
        }}
        draggable={false}
      />
    )
  }

  // fallback — simple coloured square with initial letter
  return (
    <div style={{
      width: size,
      height: size,
      background: '#1a3050',
      border: '1px solid #2563eb33',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      color: '#60a5fa',
      fontWeight: 700,
      userSelect: 'none',
      ...style,
    }}>
      {initial}
    </div>
  )
}
