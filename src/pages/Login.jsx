import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isEmail, validatePassword, validateUsername } from '../lib/validators'

// /login болон /register — нэг компонент, mode prop-оор ялгана
export default function Login({ mode = 'login' }) {
  const { user, profileReady } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ email: '', password: '', confirm: '', username: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  if (user && profileReady) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function validate() {
    const e = {}
    if (!isEmail(form.email)) e.email = 'И-мэйл хаяг буруу байна'
    if (isRegister) {
      const u = validateUsername(form.username); if (u) e.username = u
      const p = validatePassword(form.password); if (p) e.password = p
      if (form.confirm !== form.password) e.confirm = 'Нууц үг таарахгүй байна'
    } else if (!form.password) e.password = 'Нууц үгээ оруулна уу'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function submit(ev) {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true); setInfo('')
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password, options: { data: { username: form.username.trim() } },
      })
      if (error) toast.error(error.message)
      else if (!data.session) setInfo('Бүртгэл амжилттай. И-мэйлээ шалгаж хаягаа баталгаажуулна уу.')
      else toast.success('Тавтай морил!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
      if (error) toast.error(error.message === 'Invalid login credentials' ? 'И-мэйл эсвэл нууц үг буруу байна' : error.message)
    }
    setBusy(false)
  }

  const Field = ({ k, type = 'text', placeholder, autoComplete }) => (
    <div>
      <input className="input" type={type} placeholder={placeholder} autoComplete={autoComplete} value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} />
      {errors[k] && <small className="error">{errors[k]}</small>}
    </div>
  )

  return (
    <main className="container auth-wrap">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h1>
        <p className="muted">Оноо цуглуулж, захиалгын түүхээ хадгалаарай.</p>
        {isRegister && Field({ k: 'username', placeholder: 'Хэрэглэгчийн нэр', autoComplete: 'username' })}
        {Field({ k: 'email', type: 'email', placeholder: 'И-мэйл', autoComplete: 'email' })}
        {Field({ k: 'password', type: 'password', placeholder: isRegister ? 'Нууц үг (8+ тэмдэгт)' : 'Нууц үг', autoComplete: isRegister ? 'new-password' : 'current-password' })}
        {isRegister && Field({ k: 'confirm', type: 'password', placeholder: 'Нууц үг давтах', autoComplete: 'new-password' })}
        {info && <p className="ok">{info}</p>}
        <button className="btn btn-lime btn-block" disabled={busy}>{busy ? 'Түр хүлээнэ үү…' : isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</button>
        {!isRegister && <Link to="/forgot-password" className="link center-link">Нууц үгээ мартсан уу?</Link>}
        <Link to={isRegister ? '/login' : '/register'} className="link center-link">
          {isRegister ? 'Бүртгэлтэй юу? Нэвтрэх' : 'Бүртгэлгүй юу? Бүртгүүлэх'}
        </Link>
      </form>
    </main>
  )
}
