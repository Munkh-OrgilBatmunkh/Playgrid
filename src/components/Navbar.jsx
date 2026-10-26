import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTier } from '../lib/loyalty'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const tier = getTier(profile?.lifetime_points).current

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          PLAY<span>GRID</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Нүүр
          </NavLink>
          <a href="/#games">Тоглоомууд</a>
          <NavLink to="/profile">Миний оноо</NavLink>
        </nav>
        <div className="nav-right">
          {user ? (
            <>
              <Link to="/profile" className="pill-user">
                <i style={{ background: tier.color }} />
                {profile?.username || 'Профайл'} · {profile?.points ?? 0} оноо
              </Link>
              <button className="btn btn-ghost" onClick={signOut}>
                Гарах
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-lime">
              Нэвтрэх
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
