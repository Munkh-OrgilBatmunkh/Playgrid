import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <main className="container"><div className="state"><h1>404</h1><p className="muted">Хуудас олдсонгүй.</p><Link to="/" className="btn btn-lime">Нүүр хуудас руу</Link></div></main>
  )
}
