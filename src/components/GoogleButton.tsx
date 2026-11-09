import { useEffect, useRef } from 'react'

type Gsi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}

// Google's own button. It loads Google's script only when sign-in is set up.
export function GoogleButton({ clientId, onToken }: { clientId: string; onToken: (credential: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    let live = true
    const w = window as unknown as { google?: Gsi }
    const draw = () => {
      if (!live || !w.google || !box.current) return
      w.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential), ux_mode: 'popup' })
      w.google.accounts.id.renderButton(box.current, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(box.current.offsetWidth || 360, 400) })
    }
    if (w.google) draw()
    else {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = draw
      document.head.appendChild(s)
    }
    return () => {
      live = false
    }
  }, [clientId])

  return <div ref={box} className="google-btn" />
}
