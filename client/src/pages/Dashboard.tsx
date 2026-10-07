import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { greeting, isOverdue } from '../lib/dates'
import { DEFAULT_FILTERS, hasActiveFilters, type Filters } from '../lib/filters'
import type { Task } from '../lib/types'
import { useDebounce } from '../hooks/useDebounce'
import { useTasks } from '../hooks/useTasks'
import FilterBar from '../components/FilterBar'
import Logo from '../components/Logo'
import QuickAdd from '../components/QuickAdd'
import TaskModal from '../components/TaskModal'
import TaskRow from '../components/TaskRow'
import ThemeToggle from '../components/ThemeToggle'

// null = closed. task null = create (optionally with a title carried over from quick add).
type ModalState = null | { task: Task | null; title?: string }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const debouncedSearch = useDebounce(filters.search, 300)
  const { data: tasks, isLoading, error, refetch } = useTasks({ ...filters, search: debouncedSearch })
  const { data: allTasks } = useTasks(DEFAULT_FILTERS)
  const [modal, setModal] = useState<ModalState>(null)
  const [banner, setBanner] = useState('')
  const closeModal = useCallback(() => setModal(null), [])
  const filtered = hasActiveFilters(filters)

  const open = allTasks?.filter((t) => t.status !== 'done').length ?? 0
  const overdue = allTasks?.filter(isOverdue).length ?? 0
  const summary = !allTasks
    ? ' '
    : allTasks.length === 0
      ? 'Your list is empty. Add your first task below.'
      : open === 0
        ? 'Everything is done. Nice work.'
        : `${open} open${overdue > 0 ? `, ${overdue} overdue` : ''}`

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

        <div className="mt-6 space-y-5">
          <QuickAdd onDetails={(title) => setModal({ task: null, title })} onError={setBanner} />
          <FilterBar filters={filters} onChange={setFilters} />

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
                  <p className="font-medium">No tasks match these filters</p>
                  <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-2 text-sm font-medium text-accent hover:underline">
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
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={(t) => setModal({ task: t })} onError={setBanner} />
              ))}
            </ul>
          )}
        </div>
      </main>

      {modal && (
        <TaskModal
          key={modal.task?.id ?? 'new'}
          task={modal.task}
          initialTitle={modal.title}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
