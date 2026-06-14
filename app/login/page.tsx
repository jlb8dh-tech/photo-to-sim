'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{ padding: '60px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Sign in</h1>
      <form onSubmit={handleLogin}>
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
        {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: '16px' }}>
        No account? <a href="/signup">Sign up</a>
      </p>
    </div>
  )
}
