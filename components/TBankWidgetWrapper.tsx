'use client'

import { useCallback } from 'react'
import TBankWidget from './TBankWidget'

export default function TBankWidgetWrapper() {
  const terminalKey = process.env.NEXT_PUBLIC_TBANK_TERMINAL_ID || ''

  const handleReady = useCallback(() => {
    console.log('T-Bank widget ready')
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('T-Bank widget error:', error)
  }, [])

  if (!terminalKey) {
    return null
  }

  return (
    <TBankWidget
      terminalKey={terminalKey}
      onReady={handleReady}
      onError={handleError}
    />
  )
}
