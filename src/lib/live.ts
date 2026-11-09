import { useEffect, useRef } from 'react'

export type LiveEvent = { type: 'inbox' | 'message' | 'feed' | 'org' | 'membership' | 'admin'; from?: string; id?: string }

const subs = new Set<(e: LiveEvent) => void>()

// One server-sent event stream per tab. The server says what changed; screens refetch.
export function connectLive(token: string) {
  const es = new EventSource(`/api/live?token=${encodeURIComponent(token)}`)
  es.onmessage = (m) => {
    try {
      const e = JSON.parse(m.data) as LiveEvent
      subs.forEach((fn) => fn(e))
    } catch {}
  }
  return () => es.close()
}

export function emitLive(e: LiveEvent) {
  subs.forEach((fn) => fn(e))
}

export function useLive(fn: (e: LiveEvent) => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const handler = (e: LiveEvent) => ref.current(e)
    subs.add(handler)
    return () => void subs.delete(handler)
  }, [])
}
