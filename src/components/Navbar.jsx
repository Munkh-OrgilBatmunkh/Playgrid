import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTier } from '../lib/loyalty'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const tier = getTier(profile?.lifetime_points).current
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">PLAY<span>GRID</span></Link>
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Цэс" aria-expanded={open}>{open ? '✕' : '☰'}</button>
        <div className={open ? 'nav-menu open' : 'nav-menu'}>
          <nav className="nav-links">
            <NavLink to="/" end>Нүүр</NavLink>
            <Link to={{ pathname: '/', hash: '#games' }}>Тоглоомууд</Link>
            {user && <NavLink to="/profile">Миний профайл</NavLink>}
            {isAdmin && <NavLink to="/admin">Админ</NavLink>}
          </nav>
          <div className="nav-right">
            {user ? (
              <>
                <Link to="/profile" className="pill-user">
                  <i style={{ background: tier.color }} />
                  {profile?.username || 'Профайл'} · {profile?.points ?? 0} оноо
                </Link>
                <button className="btn btn-ghost" onClick={signOut}>Гарах</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Нэвтрэх</Link>
                <Link to="/register" className="btn btn-lime">Бүртгүүлэх</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
