import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const signup = mode === 'signup'

  if (!loading && session) {
    return <Navigate to="/briefing" replace />
  }

  function switchMode() {
    setMode(signup ? 'login' : 'signup')
    setError(null)
    setInfo(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfo(null)
    try {
      if (signup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: email.split('@')[0] } },
        })
        if (signupError) throw signupError
        if (!data.session) {
          setInfo('Account created. If email confirmation is on, check your inbox before logging in.')
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      <section className="login-intro">
        <p className="eyebrow">For new investors</p>
        <h1 className="login-headline">Understand the news behind the companies you follow.</h1>
        <ul className="login-points">
          <li>
            <strong>Follow what you care about.</strong> Build a watchlist and get one short briefing a day.
          </li>
          <li>
            <strong>Get the why, in plain English.</strong> See what happened, why it may matter and what's still
            unknown.
          </li>
          <li>
            <strong>Learn as you read.</strong> Tap any financial term for a simple definition, and check the original
            sources.
          </li>
        </ul>
      </section>
      <form className="login-card" onSubmit={(e) => void onSubmit(e)}>
        <Logo size={32} />
        <div className="stack-sm">
          <h2 className="login-title">{signup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted">
            {signup
              ? 'Follow companies you care about and get a plain-English briefing every morning.'
              : "Log in to see today's briefing for your watchlist."}
          </p>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@school.edu"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder={signup ? 'At least 8 characters' : 'Your password'}
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={signup ? 8 : undefined}
            required
          />
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        {info && <p className="notice">{info}</p>}
        <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
          {submitting ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
        </button>
        <p className="login-switch">
          {signup ? 'Already have an account?' : 'New to Investory?'}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {signup ? 'Log in' : 'Create an account'}
          </button>
        </p>
        <p className="login-note">
          Investory explains financial news so you can learn. It never predicts prices or tells you what to buy or
          sell.
        </p>
      </form>
    </main>
  )
}
