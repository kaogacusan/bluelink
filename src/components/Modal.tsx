import { useEffect, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react/dist/csr/X'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

// A centered dialog on desktop, a bottom sheet on phones.
export function Modal({ title, onClose, children, wide }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X weight="bold" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
