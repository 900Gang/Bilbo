import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const input =
  'mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/30'

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
    <div className="relative grid min-h-screen place-items-center bg-paper p-4">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isLogin ? 'Log in to pick up where you left off.' : 'Your tasks stay private to you.'}
            </p>
          </div>

          {!isLogin && (
            <label className="block text-sm font-medium">
              Name
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="block text-sm font-medium">
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
            {!isLogin && <span className="mt-1 block text-xs font-normal text-muted">Use at least 8 characters.</span>}
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent py-2.5 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? 'New to Bilbo? ' : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-medium text-accent hover:underline">
            {isLogin ? 'Create an account' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
