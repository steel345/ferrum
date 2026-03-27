import React from 'react'
import useStore from '../../store/useStore'
import { CheckCircle, XCircle, Info } from 'lucide-react'

export default function Toast() {
  const toast = useStore(s => s.toast)
  if (!toast) return null

  const icons = {
    success: <CheckCircle size={15} style={{ color: '#22c55e' }} />,
    error:   <XCircle size={15} style={{ color: '#ef4444' }} />,
    info:    <Info size={15} style={{ color: '#3b82f6' }} />,
  }

  return (
    <div className={`toast ${toast.type}`}>
      {icons[toast.type]}
      <span style={{ fontSize: 13 }}>{toast.message}</span>
    </div>
  )
}
