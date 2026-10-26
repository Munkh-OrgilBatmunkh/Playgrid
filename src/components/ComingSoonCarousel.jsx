import { useCallback, useEffect, useState } from 'react'
import Poster from './Poster'
import { dateMn } from '../lib/format'

const INTERVAL_MS = 4000 // слайд солигдох хугацаа (4 секунд)

export default function ComingSoonCarousel({ games, wished, onToggleWish }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = games.length

  const go = useCallback(
    (i) => setIndex(((i % count) + count) % count),
    [count],
  )
  const next = () => go(index + 1)
  const prev = () => go(index - 1)

  // Автоматаар эргэнэ; хулгана дээр очиход түр зогсоно
  useEffect(() => {
    if (count < 2 || paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [count, paused])

  if (!count) return null

  return (
    <section className="carousel-block">
      <div className="section-head">
        <span className="muted">
          {index + 1} / {count}
        </span>
      </div>

      <div
        className="carousel-row"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Товчнууд carousel-ийн ГАДНА талд */}
        <button className="arrow" onClick={prev} aria-label="Өмнөх">
          ‹
        </button>

        <div className="carousel" aria-roledescription="carousel">
          <div
            className="track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {games.map((g, i) => (
              <article className="slide" key={g.id} aria-hidden={i !== index}>
                <Poster
                  className="slide-img"
                  src={`/posters/${g.poster_file || g.slug + '.jpg'}`}
                  title={g.title}
                  seed={i}
                />
                <div className="slide-shade" />
                <div className="slide-body">
                  <span className="badge">{dateMn(g.release_date)}</span>
                  <h3>{g.title}</h3>
                  <p>{g.description}</p>
                  <button
                    className={`btn ${wished.has(g.id) ? 'btn-dark' : 'btn-lime'}`}
                    onClick={() => onToggleWish(g)}
                  >
                    {wished.has(g.id) ? '✓ Сануулах жагсаалтад' : 'Сануулах'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button className="arrow" onClick={next} aria-label="Дараагийн">
          ›
        </button>
      </div>

      <div className="dots">
        {games.map((g, i) => (
          <button
            key={g.id}
            className={i === index ? 'dot on' : 'dot'}
            onClick={() => go(i)}
            aria-label={`${i + 1}-р слайд`}
          />
        ))}
      </div>
    </section>
  )
}
