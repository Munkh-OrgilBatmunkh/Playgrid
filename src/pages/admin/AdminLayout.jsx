import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/admin', label: 'Ерөнхий', end: true },
  { to: '/admin/games', label: 'Тоглоомууд' },
  { to: '/admin/orders', label: 'Захиалга' },
  { to: '/admin/users', label: 'Хэрэглэгчид' },
]

export default function AdminLayout() {
  return (
    <div className="container admin">
      <aside className="admin-side">
        <small className="muted">Админ самбар</small>
        <nav>{LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}</nav>
      </aside>
      <section className="admin-main"><Outlet /></section>
    </div>
  )
}
