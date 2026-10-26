import Poster from './Poster'
import { money } from '../lib/format'

export default function GameCard({ game, index, onOpen }) {
  const prices = (game.products || []).map((p) => p.price)
  const from = prices.length ? Math.min(...prices) : null

  return (
    <article className="card">
      <Poster className="card-img" src={`/covers/${game.slug}.jpg`} title={game.title} seed={index} />
      <div className="card-body">
        <span className="chip-sm">{game.category}</span>
        <h3>{game.title}</h3>
        <p className="muted">{game.description}</p>
        <div className="card-foot">
          <div>
            <small className="muted">Эхлэх үнэ</small>
            <strong>{from ? money(from) : '—'}</strong>
          </div>
          <button className="btn btn-outline" onClick={() => onOpen(game)}>Цэнэглэх</button>
        </div>
      </div>
    </article>
  )
}
