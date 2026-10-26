import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTier } from '../lib/loyalty'

export default function LoyaltyCard() {
  const { user, profile } = useAuth()
  if (!user) {
    return (
      <div className="panel">
        <h3>Лоялти хөтөлбөр</h3>
        <p className="muted">Худалдан авалт бүрээс оноо цуглуулж, дараагийн захиалгадаа хөнгөлөлт аваарай.</p>
        <Link to="/login" className="btn btn-lime btn-block">Нэгдэх</Link>
      </div>
    )
  }
  const { current, next, progress } = getTier(profile?.lifetime_points)
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Миний түвшин</h3>
        <span className="tier" style={{ background: current.color }}>{current.name}</span>
      </div>
      <div className="big">{profile?.points ?? 0}<small> оноо</small></div>
      <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
      <p className="muted">
        {next ? `${next.name} хүртэл ${next.min - (profile?.lifetime_points || 0)} оноо` : 'Хамгийн дээд түвшинд хүрсэн'}
      </p>
      <Link to="/profile" className="btn btn-outline btn-block">Дэлгэрэнгүй</Link>
    </div>
  )
}
