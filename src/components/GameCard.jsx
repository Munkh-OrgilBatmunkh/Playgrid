import Poster from './Poster'

export default function GameCard({ game, index, onOpen }) {
  return (
    <article className="card">
      <Poster className="card-img" path={game.cover_path} title={game.title} seed={index} />
      <div className="card-body">
        <span className="chip-sm">{game.category}</span>
        <h3>{game.title}</h3>
        <p className="muted">{game.description}</p>
        <div className="card-foot">
          <button className="btn btn-outline" onClick={() => onOpen(game)}>Цэнэглэх</button>
        </div>
      </div>
    </article>
  )
}
