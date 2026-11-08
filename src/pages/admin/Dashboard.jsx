import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { money } from '../../lib/format'
import { ErrorState, PageLoader, EmptyState } from '../../components/ui/States'

// Статистик нь өгөгдлийн сангийн admin_stats() функцээс ирнэ (админ биш бол алдаа буцаана)
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const load = () => {
    setError('')
    supabase
      .rpc('admin_stats')
      .then(({ data, error }) =>
        error ? setError(error.message) : setStats(data),
      )
  }
  useEffect(load, [])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!stats) return <PageLoader />

  const max = Math.max(1, ...stats.daily.map((d) => Number(d.revenue)))
  const cards = [
    ['Нийт орлого', money(stats.revenue)],
    ['Төлөгдсөн захиалга', stats.orders],
    ['Хүлээгдэж буй', stats.pending],
    ['Хэрэглэгч', stats.users],
  ]

  return (
    <>
      <h1 className="h1-sm">Статистик үзүүлэлтүүд</h1>
      <div className="kpis">
        {cards.map(([k, v]) => (
          <div className="panel" key={k}>
            <small className="muted">{k}</small>
            <div className="big">{v}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Сүүлийн 14 хоногийн орлого</h3>
          {stats.daily.length ? (
            <div
              className="chart"
              role="img"
              aria-label="Өдөр тутмын орлогын график"
            >
              {stats.daily.map((d) => (
                <div
                  className="bar-col"
                  key={d.day}
                  title={`${d.day}: ${money(d.revenue)} · ${d.orders} захиалга`}
                >
                  <span className="bar-val">
                    {Math.round(Number(d.revenue) / 1000)}k
                  </span>
                  <div
                    className="bar-fill"
                    style={{ height: `${(Number(d.revenue) / max) * 100}%` }}
                  />
                  <small>{d.day.slice(5)}</small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Өгөгдөл алга"
              text="Төлөгдсөн захиалга гармагц график харагдана."
            />
          )}
        </div>
        <div className="panel">
          <h3>Хамгийн их борлуулалттай</h3>
          {stats.top_games.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Тоглоом</th>
                  <th>Захиалга</th>
                  <th>Орлого</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_games.map((g) => (
                  <tr key={g.title}>
                    <td>{g.title}</td>
                    <td>{g.orders}</td>
                    <td>{money(g.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Борлуулалт алга.</p>
          )}
        </div>
      </div>
    </>
  )
}
