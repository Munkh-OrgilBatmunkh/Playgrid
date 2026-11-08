import { useCallback, useEffect, useState } from 'react'
import Poster from './Poster'

const INTERVAL_MS = 4000 // слайд солигдох хугацаа (4 секунд)

export default function FeaturedCarousel({ games, onOpen }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = games.length
  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count])

  // Автоматаар эргэнэ; хулгана дээр очиход түр зогсоно
  useEffect(() => {
    if (count < 2 || paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [count, paused])

  if (!count) return null

  return (
    <section className="carousel-block">
      <div className="section-head"><h2>Онцлох тоглоомууд</h2></div>
      <div className="carousel-row" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <button className="arrow" onClick={() => go(index - 1)} aria-label="Өмнөх">‹</button>
        <div className="carousel" aria-roledescription="carousel">
          <div className="track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {games.map((g, i) => (
              <article className="slide" key={g.id} aria-hidden={i !== index}>
                <Poster className="slide-img" path={g.poster_path || g.cover_path} title={g.title} seed={i} />
                <div className="slide-shade" />
                <div className="slide-body">
                  <span className="badge">{g.category}</span>
                  <h3>{g.title}</h3>
                  <p>{g.description}</p>
                  <button className="btn btn-lime" onClick={() => onOpen(g)}>Цэнэглэх</button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <button className="arrow" onClick={() => go(index + 1)} aria-label="Дараагийн">›</button>
      </div>
      <div className="dots">
        {games.map((g, i) => (
          <button key={g.id} className={i === index ? 'dot on' : 'dot'} onClick={() => go(i)} aria-label={`${g.title} слайд`} />
        ))}
      </div>
    </section>
  )
}
