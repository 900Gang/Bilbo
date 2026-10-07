import { useEffect, useState, type FormEvent } from 'react'
import { errorMessage } from '../lib/api'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status, type Task } from '../lib/types'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import TagInput from './TagInput'

const field =
  'mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/30'

type Props = {
  task: Task | null
  initialTitle?: string
  initialTags?: string[]
  tagSuggestions?: string[]
  onClose: () => void
}

export default function TaskModal({ task, initialTitle = '', initialTags = [], tagSuggestions = [], onClose }: Props) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const [title, setTitle] = useState(task?.title ?? initialTitle)
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '')
  const [tags, setTags] = useState<string[]>(task?.tags ?? initialTags)
  const [error, setError] = useState('')
  const busy = create.isPending || update.isPending

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const input = { title, description, status, priority, dueDate: dueDate || null, tags }
    try {
      if (task) await update.mutateAsync({ id: task.id, ...input })
      else await create.mutateAsync(input)
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not save the task. Try again.'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={task ? 'Edit task' : 'New task'}
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:p-6"
      >
        <h2 className="font-display text-xl font-semibold tracking-tight">{task ? 'Edit task' : 'New task'}</h2>

        <label className="block text-sm font-medium">
          Title
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
        </label>

        <label className="block text-sm font-medium">
          Notes
          <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Status
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Priority
            <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          Due date
          <input className={field} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>

        <div className="text-sm font-medium">
          Tags
          <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-muted hover:bg-line hover:text-ink">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? 'Saving...' : task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}
