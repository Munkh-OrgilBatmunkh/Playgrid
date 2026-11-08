import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getTier, TIERS } from '../lib/loyalty'
import { money } from '../lib/format'
import { validateUsername } from '../lib/validators'
import { EmptyState, PageLoader } from '../components/ui/States'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState(null)
  const [log, setLog] = useState(null)
  const [mail, setMail] = useState({}) // orderId → sending | sent | failed
  const [form, setForm] = useState({ username: profile?.username ?? '', full_name: profile?.full_name ?? '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('orders').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(20).then(({ data }) => setOrders(data || []))
    supabase.from('points_log').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => setLog(data || []))
  }, [])

  const { current, next, progress } = getTier(profile?.lifetime_points)

  // UPDATE: өөрийн профайлыг засна (RLS: зөвхөн өөрийн мөр, зөвхөн username/full_name багана)
  async function save(e) {
    e.preventDefault()
    const msg = validateUsername(form.username)
    if (msg) return setError(msg)
    if (form.full_name.length > 60) return setError('Нэр хэт урт байна (60 хүртэл)')
    setError(''); setSaving(true)
    const { error } = await supabase.from('profiles').update({ username: form.username.trim(), full_name: form.full_name.trim() || null }).eq('id', user.id)
    setSaving(false)
    if (error) return setError(error.code === '23505' ? 'Энэ хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна' : error.message)
    await refreshProfile()
    toast.success('Профайл шинэчлэгдлээ')
  }

  async function resend(id) {
    setMail((m) => ({ ...m, [id]: 'sending' }))
    const { error } = await supabase.functions.invoke('send-receipt', { body: { order_id: id, resend: true } })
    setMail((m) => ({ ...m, [id]: error ? 'failed' : 'sent' }))
    if (error) toast.error('Баримт илгээж чадсангүй'); else toast.success('Баримтыг и-мэйлээр илгээлээ')
  }

  return (
    <main className="container">
      <div className="page-title"><small className="muted">{user.email}</small><h1>{profile?.username || 'Профайл'}</h1></div>

      <div className="stats">
        <div className="panel"><small className="muted">Түвшин</small><div className="big" style={{ color: current.color }}>{current.name}</div><small className="muted">{current.mult}x оноо</small></div>
        <div className="panel"><small className="muted">Боломжит оноо</small><div className="big">{profile?.points ?? 0}</div><small className="muted">= {money(profile?.points)} хөнгөлөлт</small></div>
        <div className="panel"><small className="muted">Нийт цуглуулсан</small><div className="big">{profile?.lifetime_points ?? 0}</div><div className="bar"><i style={{ width: `${progress * 100}%` }} /></div><small className="muted">{next ? `${next.name} хүртэл ${next.min - (profile?.lifetime_points ?? 0)}` : 'Дээд түвшин'}</small></div>
      </div>

      <form className="panel form-row" onSubmit={save} noValidate>
        <h3>Профайл засах</h3>
        <div className="form-grid">
          <div><label className="lbl">Хэрэглэгчийн нэр</label><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} aria-invalid={Boolean(error)} /></div>
          <div><label className="lbl">Бүтэн нэр</label><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        </div>
        {error && <small className="error">{error}</small>}
        <button className="btn btn-lime" disabled={saving}>{saving ? 'Хадгалж байна…' : 'Хадгалах'}</button>
      </form>

      <div className="two-col">
        <section className="panel">
          <h3>Захиалгын түүх</h3>
          {orders === null ? <PageLoader /> : orders.length ? orders.map((o) => (
            <div className="row" key={o.id}>
              <div>
                <b>{o.product_title}</b>
                <small className="muted">{new Date(o.created_at).toLocaleString('mn-MN')}{o.game_account !== '-' ? ` · ${o.game_account}` : ''}</small>
                <code>{o.delivery_code}</code>
              </div>
              <div className="right">
                <b>{money(o.total)}</b>
                <small className="lime-text">+{o.points_earned} оноо</small>
                <button className="link" disabled={mail[o.id] === 'sending'} onClick={() => resend(o.id)}>
                  {mail[o.id] === 'sending' ? 'Илгээж байна…' : mail[o.id] === 'sent' ? '✓ И-мэйлээр илгээв' : 'Баримт илгээх'}
                </button>
              </div>
            </div>
          )) : <EmptyState title="Захиалга байхгүй" text="Нүүр хуудаснаас анхны цэнэглэлтээ хийгээрэй." />}
        </section>
        <section className="panel">
          <h3>Онооны түүх</h3>
          {log === null ? <PageLoader /> : log.length ? log.map((l) => (
            <div className="row" key={l.id}>
              <div><b>{l.reason}</b><small className="muted">{new Date(l.created_at).toLocaleDateString('mn-MN')}</small></div>
              <b className={l.delta > 0 ? 'lime-text' : ''}>{l.delta > 0 ? '+' : ''}{l.delta}</b>
            </div>
          )) : <p className="muted">Оноо цуглуулаагүй байна.</p>}
          <h4>Түвшингүүд</h4>
          {TIERS.map((t) => <div className="row" key={t.name}><span><i className="dotc" style={{ background: t.color }} />{t.name}</span><small className="muted">{t.min}+ оноо · {t.mult}x</small></div>)}
        </section>
      </div>
    </main>
  )
}
