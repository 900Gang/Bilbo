import { useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { errorMessage } from '../lib/api'
import { formatDate, isDueToday, isOverdue } from '../lib/dates'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Task } from '../lib/types'
import { useDeleteTask, useUpdateTask } from '../hooks/useTasks'
import { CheckIcon, PencilIcon, TrashIcon } from './icons'

const priorityDot: Record<Priority, string> = {
  low: 'bg-line-strong',
  medium: 'bg-warn',
  high: 'bg-danger',
}

const iconButton =
  'grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-line hover:text-ink'

export type TaskRowProps = {
  task: Task
  onEdit: (task: Task) => void
  onError: (message: string) => void
  onTagClick?: (tag: string) => void
  // Set by SortableTaskRow when the list is in "My order" mode.
  rowRef?: Ref<HTMLLIElement>
  rowStyle?: CSSProperties
  dragging?: boolean
  handle?: ReactNode
}

export default function TaskRow({ task, onEdit, onError, onTagClick, rowRef, rowStyle, dragging, handle }: TaskRowProps) {
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const [confirming, setConfirming] = useState(false)
  const done = task.status === 'done'
  const inProgress = task.status === 'in_progress'
  const overdue = isOverdue(task)
  const dueToday = isDueToday(task)

  function toggleDone() {
    update.mutate(
      { id: task.id, status: done ? 'todo' : 'done' },
      { onError: (err) => onError(errorMessage(err, 'Could not update the task. Try again.')) },
    )
  }

  return (
    <li
      ref={rowRef}
      style={rowStyle}
      className={`group flex items-start gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0 ${
        dragging ? 'relative z-20 rounded-lg border-transparent shadow-lg ring-1 ring-line-strong' : ''
      }`}
    >
      {handle}

      <button
        type="button"
        onClick={toggleDone}
        aria-pressed={done}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        className="group/ring -mx-2.5 -mt-2.5 -mb-2.5 grid size-11 shrink-0 place-items-center"
      >
        <span
          className={`grid size-6 place-items-center rounded-full border-2 transition-colors ${
            done
              ? 'border-accent bg-accent text-on-accent'
              : inProgress
                ? 'border-accent text-accent'
                : 'border-line-strong text-transparent group-hover/ring:border-accent group-hover/ring:text-accent/50'
          }`}
        >
          {inProgress ? (
            <span className="size-2.5 rounded-full bg-accent" />
          ) : (
            <CheckIcon className="size-3.5" strokeWidth={3} />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`block min-h-0 max-w-full truncate text-left text-[15px] font-medium hover:underline ${
            done ? 'text-muted line-through' : ''
          }`}
        >
          {task.title}
        </button>

        {task.description && <p className="mt-0.5 truncate text-sm text-muted">{task.description}</p>}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${priorityDot[task.priority]}`} />
            {PRIORITY_LABEL[task.priority]} priority
          </span>
          {task.dueDate && (
            <span className={overdue ? 'font-medium text-danger' : dueToday ? 'font-medium text-warn' : ''}>
              {overdue ? 'Overdue, was due ' : dueToday ? 'Due today' : 'Due '}
              {dueToday ? '' : formatDate(task.dueDate)}
            </span>
          )}
          {inProgress && <span className="font-medium text-accent">{STATUS_LABEL.in_progress}</span>}
        </div>

        {task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick?.(tag)}
                title={`Show tasks tagged ${tag}`}
                className="min-h-0 rounded-full bg-line px-2.5 py-0.5 text-xs text-ink transition-colors hover:bg-line-strong"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Delete this task?</span>
          <button
            type="button"
            onClick={() =>
              remove.mutate(task.id, {
                onError: (err) => onError(errorMessage(err, 'Could not delete the task. Try again.')),
              })
            }
            className="rounded-lg bg-danger px-2.5 py-1 font-medium text-white hover:opacity-90"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2.5 py-1 text-muted hover:bg-line hover:text-ink"
          >
            Keep
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100">
          <button type="button" onClick={() => onEdit(task)} aria-label={`Edit "${task.title}"`} className={iconButton}>
            <PencilIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete "${task.title}"`}
            className={`${iconButton} hover:text-danger`}
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      )}
    </li>
  )
}
