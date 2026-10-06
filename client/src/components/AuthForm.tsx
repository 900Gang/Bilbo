import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'

const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4 dark:bg-slate-900">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h1>

        {!isLogin && (
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            Name
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Email
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Password
          <input
            className={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? 1 : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && <span className="text-xs text-slate-500">At least 8 characters</span>}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? 'No account? ' : 'Already registered? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </form>
    </div>
  )
}
