import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { OPEN_TO } from '../../shared/options.js'

const label = (id: string) => OPEN_TO.find((o) => o.id === id)?.label ?? id

// The "Open to" tags. They tell people it is OK to reach out.
export function OpenToChips({ ids, max }: { ids: string[]; max?: number }) {
  const shown = max ? ids.slice(0, max) : ids
  const extra = ids.length - shown.length
  return (
    <ul className="open-chips">
      {shown.map((id) => (
        <li key={id}>{label(id)}</li>
      ))}
      {extra > 0 && <li className="is-more">+{extra}</li>}
    </ul>
  )
}

export function OpenToPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  // Seeking tags fill the left column, the matching give tags fill the right one.
  return (
    <div className="picker open-picker" role="group" aria-label="Open to" style={{ gridTemplateRows: `repeat(${Math.ceil(OPEN_TO.length / 2)}, auto)` }}>
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
