import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { greeting, isDueToday, isOverdue, needsAttention } from '../lib/dates'
import { DEFAULT_FILTERS, hasActiveFilters, type Filters } from '../lib/filters'
import type { Task } from '../lib/types'
import { useDebounce } from '../hooks/useDebounce'
import { useReminders } from '../hooks/useReminders'
import { useReorderTasks, useTasks } from '../hooks/useTasks'
import FilterBar from '../components/FilterBar'
import Logo from '../components/Logo'
import QuickAdd from '../components/QuickAdd'
import ReminderPrompt from '../components/ReminderPrompt'
import SortableTaskRow from '../components/SortableTaskRow'
import TaskModal from '../components/TaskModal'
import TaskRow from '../components/TaskRow'
import ThemeToggle from '../components/ThemeToggle'

// null = closed. task null = create, optionally prefilled from the quick-add bar.
type ModalState = null | { task: Task | null; title?: string; tags?: string[] }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const debouncedSearch = useDebounce(filters.search, 300)
  const { data: fetched, isLoading, error, refetch } = useTasks({ ...filters, search: debouncedSearch })
  const { data: allTasks } = useTasks(DEFAULT_FILTERS)
  const reorder = useReorderTasks()
  const { permission, enable } = useReminders(allTasks)
  const [modal, setModal] = useState<ModalState>(null)
  const [banner, setBanner] = useState('')
  const closeModal = useCallback(() => setModal(null), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const tasks = useMemo(() => (filters.due ? fetched?.filter(needsAttention) : fetched), [fetched, filters.due])
  const allTags = useMemo(() => [...new Set(allTasks?.flatMap((t) => t.tags) ?? [])].sort(), [allTasks])
  const filtered = hasActiveFilters(filters)
  const manualOrder = filters.sort === 'position:asc'
  const canReorder = manualOrder && !filtered && (tasks?.length ?? 0) > 1

  const open = allTasks?.filter((t) => t.status !== 'done').length ?? 0
  const dueToday = allTasks?.filter(isDueToday).length ?? 0
  const overdue = allTasks?.filter(isOverdue).length ?? 0
  const attention = dueToday + overdue

  let summary = ' '
  if (allTasks) {
    if (allTasks.length === 0) summary = 'Your list is empty. Add your first task below.'
    else if (open === 0) summary = 'Everything is done. Nice work.'
    else {
      const parts = [`${open} open`]
      if (dueToday > 0) parts.push(`${dueToday} due today`)
      if (overdue > 0) parts.push(`${overdue} overdue`)
      summary = parts.join(', ')
    }
  }

  // Screen reader messages use task titles instead of internal ids.
  const titleOf = (id: UniqueIdentifier) => tasks?.find((t) => t.id === id)?.title ?? 'Task'
  const positionOf = (id: UniqueIdentifier) => `${(tasks?.findIndex((t) => t.id === id) ?? 0) + 1} of ${tasks?.length ?? 0}`
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${titleOf(active.id)} is over position ${positionOf(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => `${titleOf(active.id)} dropped at position ${positionOf(over?.id ?? active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} stays where it was.`,
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || !tasks) return
    const from = tasks.findIndex((t) => t.id === active.id)
    const to = tasks.findIndex((t) => t.id === over.id)
    if (from < 0 || to < 0) return
    reorder.mutate(arrayMove(tasks, from, to).map((t) => t.id), {
      onError: (err) => setBanner(errorMessage(err, 'Could not save the new order. Try again.')),
    })
  }

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })
  const showTag = (tag: string) => setFilters({ ...filters, tag })
  const rowProps = { onEdit: (t: Task) => setModal({ task: t }), onError: setBanner, onTagClick: showTag }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-1 text-sm">
            <ThemeToggle />
            <span className="mx-2 hidden max-w-40 truncate text-muted sm:inline">{user?.name}</span>
            <button onClick={logout} className="rounded-lg px-3 py-1.5 text-muted hover:bg-line hover:text-ink">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 min-h-6 text-muted">{summary}</p>
        <ReminderPrompt permission={permission} onEnable={enable} />

        <div className="mt-6 space-y-5">
          <QuickAdd onDetails={(title, tags) => setModal({ task: null, title, tags })} onError={setBanner} />
          <FilterBar filters={filters} onChange={setFilters} tags={allTags} attentionCount={attention} />

          {manualOrder && (tasks?.length ?? 0) > 1 && (
            <p className="text-xs text-muted">
              {canReorder
                ? 'Drag the handle on the left to arrange your tasks. New tasks appear at the top.'
                : 'Clear your filters to drag tasks into a new order.'}
            </p>
          )}

          {banner && (
            <p role="alert" className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {banner}
              <button onClick={() => setBanner('')} className="ml-3 font-medium underline">
                Dismiss
              </button>
            </p>
          )}

          {isLoading && <p className="py-8 text-center text-muted">Loading your tasks...</p>}

          {error && (
            <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {errorMessage(error, 'Could not load your tasks.')}{' '}
              <button onClick={() => refetch()} className="font-medium underline">
                Try again
              </button>
            </div>
          )}

          {tasks && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
              {filtered ? (
                <>
                  <p className="font-medium">
                    {filters.due && !filters.search && !filters.status && !filters.priority && !filters.tag
                      ? 'Nothing is due or overdue'
                      : 'No tasks match these filters'}
                  </p>
                  <button onClick={clearFilters} className="mt-2 text-sm font-medium text-accent hover:underline">
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium">No tasks yet</p>
                  <p className="mt-1 text-sm text-muted">Type a task above and press Enter to add it.</p>
                </>
              )}
            </div>
          )}

          {tasks && tasks.length > 0 && (
            <ul className="overflow-hidden rounded-xl border border-line bg-surface">
              {canReorder ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                  accessibility={{
                    announcements,
                    screenReaderInstructions: {
                      draggable:
                        'Press space to pick up a task, use the up and down arrow keys to move it, then press space again to drop it. Press escape to cancel.',
                    },
                  }}
                >
                  <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                      <SortableTaskRow key={task.id} task={task} {...rowProps} />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                tasks.map((task) => <TaskRow key={task.id} task={task} {...rowProps} />)
              )}
            </ul>
          )}
        </div>
      </main>

      {modal && (
        <TaskModal
          key={modal.task?.id ?? 'new'}
          task={modal.task}
          initialTitle={modal.title}
          initialTags={modal.tags}
          tagSuggestions={allTags}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
