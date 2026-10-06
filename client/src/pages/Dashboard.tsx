import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import type { Task } from '../lib/types'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

// null = closed, 'new' = create, Task = edit
type ModalState = null | 'new' | Task

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { data: tasks, isLoading, error, refetch } = useTasks()
  const [modal, setModal] = useState<ModalState>(null)
  const [banner, setBanner] = useState('')
  const closeModal = useCallback(() => setModal(null), [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <h1 className="text-lg font-bold">Task Manager</h1>
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="hidden max-w-40 truncate sm:inline">{user?.name}</span>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white sm:hidden"
          >
            {user?.name?.charAt(0).toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 pb-24 sm:pb-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">My tasks</h2>
          <button
            onClick={() => setModal('new')}
            className="hidden rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 sm:block"
          >
            + New task
          </button>
        </div>

        {banner && (
          <p role="alert" className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {banner}
            <button onClick={() => setBanner('')} aria-label="Dismiss" className="ml-2 px-2 font-bold">
              x
            </button>
          </p>
        )}

        {isLoading && <p className="text-slate-500">Loading tasks...</p>}

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorMessage(error, 'Could not load tasks')}{' '}
            <button onClick={() => refetch()} className="font-medium underline">
              Retry
            </button>
          </div>
        )}

        {tasks && tasks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
            <p className="mb-3">No tasks yet.</p>
            <button onClick={() => setModal('new')} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Create your first task
            </button>
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setModal} onError={setBanner} />
            ))}
          </ul>
        )}
      </main>

      <button
        onClick={() => setModal('new')}
        aria-label="New task"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-full bg-indigo-600 text-3xl text-white shadow-lg hover:bg-indigo-700 sm:hidden"
      >
        +
      </button>

      {modal && (
        <TaskModal
          key={modal === 'new' ? 'new' : modal.id}
          task={modal === 'new' ? null : modal}
          onClose={closeModal}
        />
      )}
    </div>
  )
}