import { useId, useState, type KeyboardEvent } from 'react'
import { MAX_TAGS, MAX_TAG_LENGTH, normalizeTag } from '../lib/tags'
import { XIcon } from './icons'

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export default function TagInput({ value, onChange, suggestions = [] }: Props) {
  const [draft, setDraft] = useState('')
  const [hint, setHint] = useState('')
  const listId = useId()
  const full = value.length >= MAX_TAGS

  function commit() {
    const raw = draft.trim()
    if (!raw) return
    const tag = normalizeTag(raw)
    if (!tag) {
      setHint(`Tags can use letters, numbers, - and _, up to ${MAX_TAG_LENGTH} characters.`)
      return
    }
    setHint('')
    if (!value.includes(tag) && !full) onChange([...value, tag])
    setDraft('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-line px-2.5 py-0.5 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove tag ${tag}`}
              className="grid size-5 min-h-0 place-items-center rounded-full text-muted hover:bg-line-strong hover:text-ink"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          list={listId}
          disabled={full}
          maxLength={MAX_TAG_LENGTH + 1}
          placeholder={full ? `Up to ${MAX_TAGS} tags` : value.length === 0 ? 'Type a tag and press Enter' : ''}
          aria-label="Add a tag"
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-ink outline-none placeholder:text-muted"
        />
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      </div>
      {hint && <p className="mt-1 text-xs text-danger">{hint}</p>}
    </div>
  )
}
