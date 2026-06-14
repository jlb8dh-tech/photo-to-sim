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
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) } else { router.push('/') }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'Manrope,system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background:'rgba(10,10,10,0.97)', border:'1px solid #1e1e1e', width:'100%', maxWidth:'440px', padding:'36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
          <span style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'18px', letterSpacing:'0.1em', color:'#fff' }}>BLCK <span style={{ background:'linear-gradient(90deg,#c084fc,#818cf8,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>UNICRN</span></span>
        </div>
        <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#c084fc', marginBottom:'10px' }}>WELCOME BACK</p>
        <h1 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'34px', color:'#fff', lineHeight:1, marginBottom:'8px' }}>Sign in</h1>
        <p style={{ fontSize:'14px', fontWeight:300, color:'#666', lineHeight:1.55, marginBottom:'28px' }}>Access your safety simulations and training dashboard.</p>
        <form onSubmit={handleLogin}>
          {[['Work Email','email','you@company.com',email,setEmail],['Password','password','Your password',password,setPassword]].map(([label,type,ph,val,setter]:any) => (
            <div key={label} style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#555', display:'block', marginBottom:'7px' }}>{label}</label>
              <input type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} required style={{ width:'100%', background:'#0a0a0a', border:'1px solid #1e1e1e', color:'#fff', fontFamily:'Manrope,sans-serif', fontSize:'14px', padding:'12px 14px', outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}
          {error && <p style={{ color:'#ff4d4d', fontSize:'13px', marginBottom:'12px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width:'100%', background:loading?'#333':'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)', color:'#fff', fontFamily:'Manrope,sans-serif', fontWeight:700, fontSize:'14px', padding:'14px', border:'none', cursor:loading?'not-allowed':'pointer', marginTop:'20px', borderRadius:'2px', opacity:loading?0.5:1 }}>
            {loading?'Signing in...':'Sign in →'}
          </button>
        </form>
        <p style={{ marginTop:'20px', fontSize:'13px', color:'#444', textAlign:'center' }}>No account? <a href="/signup" style={{ color:'#c084fc', textDecoration:'none', fontWeight:600 }}>Create one</a></p>
      </div>
    </div>
  )
}
