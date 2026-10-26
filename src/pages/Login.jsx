import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  if (user) return <Navigate to="/" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) setError(error.message); else navigate('/')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { username: form.username } },
      })
      if (error) setError(error.message)
      else if (!data.session) setInfo('Бүртгэл амжилттай. И-мэйлээ шалгаж хаягаа баталгаажуулна уу.')
      else navigate('/')
    }
    setBusy(false)
  }

  return (
    <main className="container auth-wrap">
      <form className="auth" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>
        <p className="muted">Оноо цуглуулж, захиалгын түүхээ хадгалаарай.</p>
        {mode === 'signup' && (
          <input className="input" placeholder="Хэрэглэгчийн нэр" required minLength={3} value={form.username} onChange={set('username')} />
        )}
        <input className="input" type="email" placeholder="И-мэйл" required value={form.email} onChange={set('email')} />
        <input className="input" type="password" placeholder="Нууц үг (6+ тэмдэгт)" required minLength={6} value={form.password} onChange={set('password')} />
        {error && <p className="error">{error}</p>}
        {info && <p className="ok">{info}</p>}
        <button className="btn btn-lime btn-block" disabled={busy}>
          {busy ? 'Түр хүлээнэ үү…' : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
        </button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}>
          {mode === 'login' ? 'Бүртгэлгүй юу? Бүртгүүлэх' : 'Бүртгэлтэй юу? Нэвтрэх'}
        </button>
      </form>
    </main>
  )
}
