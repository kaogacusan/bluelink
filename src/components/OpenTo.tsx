import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { OPEN_TO } from '../../shared/options.js'

const label = (id: string) => OPEN_TO.find((o) => o.id === id)?.label ?? id

// The "Open to" tags. They tell people it is OK to reach out.
export function OpenTo({ ids, max, highlight = [] }: { ids: string[]; max?: number; highlight?: string[] }) {
  if (!ids.length) return null
  const shown = max ? ids.slice(0, max) : ids
  const extra = ids.length - shown.length
  return (
    <ul className="tags">
      {shown.map((id) => (
        <li key={id} className={`tag ${highlight.includes(id) ? 'is-match' : ''}`}>
          {label(id)}
        </li>
      ))}
      {extra > 0 && <li className="tag is-more">+{extra}</li>}
    </ul>
  )
}

export function OpenToPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="picker" role="group" aria-label="Open to">
      {OPEN_TO.map((o) => {
        const on = value.includes(o.id)
        return (
          <button
            type="button"
            key={o.id}
            className={`pick ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
          >
            {on && <Check weight="bold" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
