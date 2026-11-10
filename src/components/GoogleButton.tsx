import { useEffect, useRef } from 'react'

type Gsi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}

// Our own button, so it matches the form. Google's real button sits on top of it, see-through, and takes the click.
// It loads Google's script only when sign-in is set up.
export function GoogleButton({ clientId, onToken }: { clientId: string; onToken: (credential: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const hit = useRef<HTMLDivElement>(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    let live = true
    const w = window as unknown as { google?: Gsi }
    // Google's button is at most 400px wide, so stretch it to cover all of ours.
    const fit = () => {
      const b = box.current
      const h = hit.current
      if (!b || !h || !h.offsetWidth || !h.offsetHeight) return
      h.style.transform = `scale(${b.offsetWidth / h.offsetWidth}, ${b.offsetHeight / h.offsetHeight})`
    }
    const ro = new ResizeObserver(fit)
    if (box.current) ro.observe(box.current)
    if (hit.current) ro.observe(hit.current)
    const draw = () => {
      if (!live || !w.google || !box.current || !hit.current) return
      w.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential), ux_mode: 'popup' })
      w.google.accounts.id.renderButton(hit.current, { size: 'large', shape: 'rectangular', text: 'continue_with', width: Math.min(box.current.offsetWidth || 360, 400) })
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
      ro.disconnect()
    }
  }, [clientId])

  return (
    <div ref={box} className="google-btn">
      <div className="btn btn-lg btn-block google-face" aria-hidden>
        <svg viewBox="0 0 48 48" width="20" height="20">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </div>
      <div ref={hit} className="google-hit" />
    </div>
  )
}
