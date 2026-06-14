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
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setError(error.message); setLoading(false) } else { setSubmitted(true) }
  }

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'Manrope,system-ui,sans-serif' }}>
      <div style={{ background:'rgba(10,10,10,0.97)', border:'1px solid #1e1e1e', width:'100%', maxWidth:'440px', padding:'36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)' }} />
        <div style={{ textAlign:'center', paddingTop:'12px' }}>
          <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#c084fc', marginBottom:'10px' }}>CHECK YOUR EMAIL</p>
          <h1 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'34px', color:'#fff', marginBottom:'12px' }}>Confirm your account</h1>
          <p style={{ fontSize:'14px', fontWeight:300, color:'#666', lineHeight:1.55, marginBottom:'28px' }}>We sent a confirmation link to <span style={{ color:'#c084fc', fontWeight:600 }}>{email}</span>. Click the link to activate your account.</p>
          <a href="/login" style={{ display:'block', width:'100%', background:'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)', color:'#fff', fontWeight:700, fontSize:'14px', padding:'14px', textDecoration:'none', textAlign:'center', borderRadius:'2px' }}>Go to sign in →</a>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'Manrope,system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background:'rgba(10,10,10,0.97)', border:'1px solid #1e1e1e', width:'100%', maxWidth:'440px', padding:'36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
          <span style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'18px', letterSpacing:'0.1em', color:'#fff' }}>BLCK <span style={{ background:'linear-gradient(90deg,#c084fc,#818cf8,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>UNICRN</span></span>
        </div>
        <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#c084fc', marginBottom:'10px' }}>CREATE ACCOUNT</p>
        <h1 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'34px', color:'#fff', lineHeight:1, marginBottom:'8px' }}>Get started</h1>
        <p style={{ fontSize:'14px', fontWeight:300, color:'#666', lineHeight:1.55, marginBottom:'28px' }}>Create your account to access safety simulations.</p>
        <form onSubmit={handleSignup}>
          {[['Work Email','email','you@company.com',email,setEmail],['Password','password','Min 6 characters',password,setPassword],['Confirm Password','password','Repeat password',confirm,setConfirm]].map(([label,type,ph,val,setter]:any) => (
            <div key={label} style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#555', display:'block', marginBottom:'7px' }}>{label}</label>
              <input type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} required style={{ width:'100%', background:'#0a0a0a', border:'1px solid #1e1e1e', color:'#fff', fontFamily:'Manrope,sans-serif', fontSize:'14px', padding:'12px 14px', outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}
          {error && <p style={{ color:'#ff4d4d', fontSize:'13px', marginBottom:'12px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width:'100%', background:loading?'#333':'linear-gradient(135deg,#a855f7,#7c6dff,#06b6d4)', color:'#fff', fontFamily:'Manrope,sans-serif', fontWeight:700, fontSize:'14px', padding:'14px', border:'none', cursor:loading?'not-allowed':'pointer', marginTop:'20px', borderRadius:'2px', opacity:loading?0.5:1 }}>
            {loading?'Creating account...':'Create account →'}
          </button>
        </form>
        <p style={{ marginTop:'20px', fontSize:'13px', color:'#444', textAlign:'center' }}>Already have an account? <a href="/login" style={{ color:'#c084fc', textDecoration:'none', fontWeight:600 }}>Sign in</a></p>
      </div>
    </div>
  )
}
