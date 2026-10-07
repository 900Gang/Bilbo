import { useState, type FormEvent } from 'react'
import { errorMessage } from '../lib/api'
import { parseQuickAdd } from '../lib/tags'
import { useCreateTask } from '../hooks/useTasks'

type Props = {
  onDetails: (title: string, tags: string[]) => void
  onError: (message: string) => void
}

export default function QuickAdd({ onDetails, onError }: Props) {
  const create = useCreateTask()
  const [text, setText] = useState('')
  const parsed = parseQuickAdd(text)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parsed.title) return
    create.mutate(
      { title: parsed.title, description: '', status: 'todo', priority: 'medium', dueDate: null, tags: parsed.tags },
      {
        onSuccess: () => setText(''),
        onError: (err) => onError(errorMessage(err, 'Could not add the task. Try again.')),
      },
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25"
    >
      <input
        aria-label="New task title"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs doing? Add #tags inline"
        maxLength={240}
        className="min-w-0 basis-full bg-transparent px-2 py-1.5 outline-none placeholder:text-muted sm:basis-0 sm:flex-1"
      />
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDetails(parsed.title, parsed.tags)}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-line hover:text-ink"
        >
          Add details
        </button>
        <button
          type="submit"
          disabled={create.isPending || !parsed.title}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Add task
        </button>
      </div>
      {parsed.tags.length > 0 && (
        <p className="basis-full px-2 text-xs text-muted">Tags: {parsed.tags.join(', ')}</p>
      )}
    </form>
  )
}
