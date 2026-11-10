import { useEffect, useRef, useState } from 'react'

type TokenClient = { requestAccessToken: () => void }
type Gsi = {
  accounts: {
    oauth2: {
      initTokenClient: (o: { client_id: string; scope: string; callback: (r: { access_token?: string }) => void }) => TokenClient
    }
  }
}

// Our own button. It opens Google's sign-in window from this page, so Google sends the answer straight back here.
// It loads Google's script only when sign-in is set up.
export function GoogleButton({ clientId, onToken }: { clientId: string; onToken: (accessToken: string) => void }) {
  const client = useRef<TokenClient | null>(null)
  const [ready, setReady] = useState(false)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    let live = true
    const w = window as unknown as { google?: Gsi }
    const init = () => {
      if (!live || !w.google?.accounts?.oauth2) return
      client.current = w.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (r) => r.access_token && cb.current(r.access_token),
      })
      setReady(true)
    }
    if (w.google?.accounts?.oauth2) init()
    else {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    }
    return () => {
      live = false
    }
  }, [clientId])

  return (
    <button type="button" className="btn btn-lg btn-block google-btn" disabled={!ready} onClick={() => client.current?.requestAccessToken()}>
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      Continue with Google
    </button>
  )
}
