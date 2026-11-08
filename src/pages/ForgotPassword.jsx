import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isEmail } from '../lib/validators'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!isEmail(email)) return setError('И-мэйл хаяг буруу байна')
    setError(''); setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="container auth-wrap">
      <form className="auth" onSubmit={submit} noValidate>
        <h1>Нууц үг сэргээх</h1>
        {sent ? (
          <p className="ok">Хэрэв энэ и-мэйл бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ. И-мэйлээ шалгана уу.</p>
        ) : (
          <>
            <p className="muted">Бүртгэлтэй и-мэйл хаягаа оруулбал сэргээх холбоос илгээнэ.</p>
            <input className="input" type="email" placeholder="И-мэйл" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} />
            {error && <small className="error">{error}</small>}
            <button className="btn btn-lime btn-block" disabled={busy}>{busy ? 'Илгээж байна…' : 'Холбоос илгээх'}</button>
          </>
        )}
        <Link to="/login" className="link center-link">← Нэвтрэх хуудас руу буцах</Link>
      </form>
    </main>
  )
}
