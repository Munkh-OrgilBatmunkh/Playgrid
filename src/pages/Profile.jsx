import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getTier, TIERS } from '../lib/loyalty'
import { money } from '../lib/format'

export default function Profile() {
  const { user, profile, loading } = useAuth()
  const [orders, setOrders] = useState([])
  const [log, setLog] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(20).then(({ data }) => setOrders(data || []))
    supabase.from('points_log').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => setLog(data || []))
  }, [user])

  if (loading) return <main className="container"><p className="muted">Ачаалж байна…</p></main>
  if (!user) return <Navigate to="/login" replace />

  const { current, next, progress } = getTier(profile?.lifetime_points)

  return (
    <main className="container">
      <div className="page-title">
        <small className="muted">{user.email}</small>
        <h1>{profile?.username || 'Профайл'}</h1>
      </div>

      <div className="stats">
        <div className="panel"><small className="muted">Түвшин</small><div className="big" style={{ color: current.color }}>{current.name}</div><small className="muted">{current.mult}x оноо</small></div>
        <div className="panel"><small className="muted">Боломжит оноо</small><div className="big">{profile?.points ?? 0}</div><small className="muted">= {money(profile?.points)} хөнгөлөлт</small></div>
        <div className="panel"><small className="muted">Нийт цуглуулсан</small><div className="big">{profile?.lifetime_points ?? 0}</div><div className="bar"><i style={{ width: `${progress * 100}%` }} /></div><small className="muted">{next ? `${next.name} хүртэл ${next.min - profile.lifetime_points}` : 'Дээд түвшин'}</small></div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h3>Захиалгын түүх</h3>
          {orders.length ? orders.map((o) => (
            <div className="row" key={o.id}>
              <div>
                <b>{o.product_title}</b>
                <small className="muted">{new Date(o.created_at).toLocaleString('mn-MN')}{o.game_account !== '-' ? ` · ${o.game_account}` : ''}</small>
                <code>{o.delivery_code}</code>
              </div>
              <div className="right"><b>{money(o.total)}</b><small className="lime-text">+{o.points_earned} оноо</small></div>
            </div>
          )) : <p className="muted">Захиалга байхгүй байна. Нүүр хуудаснаас анхны цэнэглэлтээ хийгээрэй.</p>}
        </section>
        <section className="panel">
          <h3>Онооны түүх</h3>
          {log.length ? log.map((l) => (
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
