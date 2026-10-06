import { useState } from 'react'
import { errorMessage } from '../lib/api'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status, type Task } from '../lib/types'
import { useDeleteTask, useUpdateTask } from '../hooks/useTasks'

const priorityStyle: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === 'done') return false
  return new Date(task.dueDate).getTime() < new Date().setUTCHours(0, 0, 0, 0)
}

type Props = {
  task: Task
  onEdit: (task: Task) => void
  onError: (message: string) => void
}

export default function TaskCard({ task, onEdit, onError }: Props) {
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const [confirming, setConfirming] = useState(false)
  const done = task.status === 'done'

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold break-words ${done ? 'text-slate-400 line-through' : ''}`}>{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-slate-600 break-words whitespace-pre-wrap dark:text-slate-400">{task.description}</p>
      )}

      {task.dueDate && (
        <p className={`text-xs ${isOverdue(task) ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
          {isOverdue(task) ? 'Overdue: ' : 'Due: '}
          {formatDate(task.dueDate)}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <select
          aria-label="Status"
          value={task.status}
          onChange={(e) =>
            update.mutate(
              { id: task.id, status: e.target.value as Status },
              { onError: (err) => onError(errorMessage(err, 'Could not update task')) },
            )
          }
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        {confirming ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Delete?</span>
            <button
              onClick={() =>
                remove.mutate(task.id, { onError: (err) => onError(errorMessage(err, 'Could not delete task')) })
              }
              className="rounded-lg bg-red-600 px-2 py-1 text-white hover:bg-red-700"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  )
}