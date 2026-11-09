import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react'

const DEGREES = new Set(['ab', 'bs', 'bfa', 'ms', 'ma', 'm'])
const SMALL = new Set(['of', 'and', 'in', 'with', 'the'])
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean)

// Lower is better, -1 is no match. Every typed word must hit: the start of a word ("comp"),
// the initials Ateneans use ("cs", "ite", "dgdd"), or anywhere as a last resort.
function score(option: string, typed: string) {
  const q = words(typed)
  if (!q.length) return 0
  const o = words(option)
  const initials = o.filter((w) => !DEGREES.has(w) && !SMALL.has(w)).map((w) => w[0]).join('')
  let worst = 0
  for (const w of q) {
    const s = o.some((x) => x.startsWith(w)) ? 1 : w.length > 1 && initials.includes(w) ? 2 : option.toLowerCase().includes(w) ? 3 : -1
    if (s < 0) return -1
    worst = Math.max(worst, s)
  }
  // "comp" ranks BS Computer Science above BS Electronics Engineering, which only has a later word.
  const body = option.toLowerCase().replace(/^\S+\s/, '')
  return worst === 1 && body.startsWith(typed.trim().toLowerCase()) ? 0 : worst
}

type Props = { value: string; onChange: (v: string) => void; options: string[] } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

// A text box that suggests matches as you type. Free text still works.
export function Combo({ value, onChange, options, className = 'input', ...input }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState(false)
  const [active, setActive] = useState(-1)
  const list = useRef<HTMLUListElement>(null)

  // Until they type, show the whole list so they can browse or change a saved pick.
  const matches = useMemo(() => {
    const q = typed ? value : ''
    return options
      .map((o, i) => ({ o, i, s: score(o, q) }))
      .filter((m) => m.s >= 0)
      .sort((a, b) => a.s - b.s || a.i - b.i)
      .map((m) => m.o)
  }, [options, value, typed])

  const shown = open && matches.length > 0

  useEffect(() => {
    if (shown) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [shown, active])

  function openList() {
    setOpen(true)
    setTyped(false)
    setActive(options.indexOf(value))
  }

  function pick(o: string) {
    onChange(o)
    setOpen(false)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + step + matches.length) % matches.length)
    } else if (e.key === 'Enter' && shown && matches[active]) {
      e.preventDefault()
      pick(matches[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="combo">
      <input
        {...input}
        className={className}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={id}
        aria-activedescendant={shown && active >= 0 ? `${id}-${active}` : undefined}
        value={value}
        onFocus={openList}
        onClick={() => !open && openList()}
        onBlur={() => setOpen(false)}
        onKeyDown={onKey}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setTyped(true)
          setActive(e.target.value.trim() ? 0 : -1)
        }}
      />
      {shown && (
        <ul className="combo-list" id={id} role="listbox" ref={list}>
          {matches.map((o, i) => (
            <li
              key={o}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o === value}
              className={i === active ? 'is-active' : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              // preventDefault stops a wrapping <label> from clicking the input and opening the list again.
              onClick={(e) => {
                e.preventDefault()
                pick(o)
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
