import { useEffect, useState, type FormEvent } from 'react'
import { errorMessage } from '../lib/api'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status, type Task } from '../lib/types'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'

const field =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

type Props = {
  task: Task | null
  onClose: () => void
}

export default function TaskModal({ task, onClose }: Props) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '')
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
    const input = { title, description, status, priority, dueDate: dueDate || null }
    try {
      if (task) await update.mutateAsync({ id: task.id, ...input })
      else await create.mutateAsync(input)
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not save task'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={task ? 'Edit task' : 'New task'}
        className="max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
      >
        <h2 className="text-xl font-bold">{task ? 'Edit task' : 'New task'}</h2>

        <label className="block text-sm">
          Title
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
        </label>

        <label className="block text-sm">
          Description
          <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Status
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
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

        <label className="block text-sm">
          Due date
          <input className={field} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}