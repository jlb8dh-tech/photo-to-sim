'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h1>Check your email</h1>
        <p>We sent a confirmation link to <strong>{email}</strong></p>
        <p>Click the link to activate your account, then come back to sign in.</p>
        <a href="/login">Go to sign in</a>
      </div>
    )
  }

  return (
    <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Create account</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="your@work-email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '12px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '12px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '12px', fontSize: '16px' }}
        />
        {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: '16px' }}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </div>
  )
}
