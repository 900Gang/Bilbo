import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h1 className="text-lg font-bold">Task Manager</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.name}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="p-4">Tasks coming in Milestone 5.</main>
    </div>
  )
}
