'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface LiveRegionContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('')
      setTimeout(() => setAssertiveMessage(message), 100)
    } else {
      setPoliteMessage('')
      setTimeout(() => setPoliteMessage(message), 100)
    }
  }, [])

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}

      {/* Polite announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  )
}

export function useAnnounce() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useAnnounce must be used within a LiveRegionProvider')
  }
  return context.announce
}
