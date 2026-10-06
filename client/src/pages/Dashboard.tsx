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
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h1 className="text-lg font-bold">Task Manager</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My tasks</h2>
          <button
            onClick={() => setModal('new')}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            + New task
          </button>
        </div>

        {banner && (
          <p role="alert" className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {banner}
            <button onClick={() => setBanner('')} aria-label="Dismiss" className="ml-2 font-bold">
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setModal} onError={setBanner} />
            ))}
          </ul>
        )}
      </main>

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