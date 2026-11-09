import { useCallback, useEffect, useRef, useState } from 'react'
import { load, save } from './storage'

let token: string | null = load('token', null)
const tokenListeners = new Set<() => void>()

export const session = {
  get token() {
    return token
  },
  set(t: string | null) {
    token = t
    save('token', t)
    tokenListeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void) {
    tokenListeners.add(fn)
    return () => void tokenListeners.delete(fn)
  },
}

// GET when there is no body, POST when there is one.
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('No connection. Check your internet and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) session.set(null)
  // Membership ran out or a payment was rejected: the app shows the join screen again.
  if (res.status === 402) window.dispatchEvent(new Event('bl:membership'))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  return data as T
}

export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const seq = useRef(0)

  const reload = useCallback(async () => {
    if (!path) return
    const n = ++seq.current
    try {
      const d = await api<T>(path)
      if (n === seq.current) {
        setData(d)
        setError('')
      }
    } catch (e) {
      if (n === seq.current) setError((e as Error).message)
    }
  }, [path])

  useEffect(() => {
    setData(null)
    reload()
  }, [reload])

  return { data, setData, error, reload }
}
