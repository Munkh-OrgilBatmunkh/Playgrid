import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { validatePassword } from '../lib/validators'
import { PageLoader } from '../components/ui/States'

// И-мэйлээр ирсэн холбоосоор орж ирэхэд Supabase түр session үүсгэнэ → шинэ нууц үг тохируулна
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />

  async function submit(e) {
    e.preventDefault()
    const msg = validatePassword(password) || (password !== confirm ? 'Нууц үг таарахгүй байна' : '')
    if (msg) return setError(msg)
    setError(''); setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    toast.success('Нууц үг амжилттай солигдлоо')
    navigate('/')
  }

  return (
    <main className="container auth-wrap">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>Шинэ нууц үг</h1>
        {!user ? (
          <p className="error">Холбоос хүчингүй эсвэл хугацаа дууссан байна. <Link to="/forgot-password" className="link">Дахин хүсэх</Link></p>
        ) : (
          <>
            <input className="input" type="password" placeholder="Шинэ нууц үг (8+ тэмдэгт)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="input" type="password" placeholder="Нууц үг давтах" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <small className="error">{error}</small>}
            <button className="btn btn-lime btn-block" disabled={busy}>{busy ? 'Хадгалж байна…' : 'Нууц үг солих'}</button>
          </>
        )}
      </form>
    </main>
  )
}
