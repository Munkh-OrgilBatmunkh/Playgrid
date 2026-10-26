import { useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ComingSoonCarousel from '../components/ComingSoonCarousel'
import GameCard from '../components/GameCard'
import TopUpModal from '../components/TopUpModal'
import LoyaltyCard from '../components/LoyaltyCard'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [wished, setWished] = useState(new Set())
  const [top, setTop] = useState([])
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Бүгд')
  const [open, setOpen] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isConfigured) return
    supabase.from('games').select('*, products(*)').order('sort_order').then(({ data, error }) => {
      if (error) setError(error.message)
      else setGames(data)
    })
    supabase.rpc('top_players', { p_limit: 5 }).then(({ data }) => setTop(data || []))
  }, [])

  useEffect(() => {
    if (!user) return setWished(new Set())
    supabase.from('wishlist').select('game_id').then(({ data }) => setWished(new Set((data || []).map((r) => r.game_id))))
  }, [user])

  const comingSoon = games.filter((g) => g.is_coming_soon)
  const active = games.filter((g) => !g.is_coming_soon)
  const categories = ['Бүгд', ...new Set(active.map((g) => g.category))]

  const visible = useMemo(
    () => active.filter((g) => (cat === 'Бүгд' || g.category === cat) && g.title.toLowerCase().includes(query.toLowerCase())),
    [active, cat, query]
  )

  async function toggleWish(game) {
    if (!user) return navigate('/login')
    const next = new Set(wished)
    if (wished.has(game.id)) {
      next.delete(game.id)
      await supabase.from('wishlist').delete().eq('game_id', game.id).eq('user_id', user.id)
    } else {
      next.add(game.id)
      await supabase.from('wishlist').insert({ game_id: game.id, user_id: user.id })
    }
    setWished(next)
  }

  return (
    <main className="container">
      {!isConfigured && (
        <div className="notice">
          <b>Supabase холбогдоогүй байна.</b> <code>.env</code> файлд <code>VITE_SUPABASE_URL</code> болон{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>-г бөглөж, серверийг дахин ачаална уу.
        </div>
      )}
      {error && <div className="notice">Өгөгдөл ачаалж чадсангүй: {error}</div>}

      <div className="page-title">
        <small className="muted">Тоглоомын кредит</small>
        <h1>Хурдан цэнэглэ. Оноо цуглуул.</h1>
      </div>

      <ComingSoonCarousel games={comingSoon} wished={wished} onToggleWish={toggleWish} />

      <div className="layout" id="games">
        <section>
          <div className="section-head"><h2>Цэнэглэх боломжтой тоглоомууд</h2></div>
          <div className="filters">
            <input className="input search" placeholder="Тоглоом хайх…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {categories.map((c) => (
              <button key={c} className={c === cat ? 'chip on' : 'chip'} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="grid">
            {visible.map((g, i) => <GameCard key={g.id} game={g} index={i} onOpen={setOpen} />)}
          </div>
          {isConfigured && !visible.length && <p className="muted empty">Тохирох тоглоом олдсонгүй. Хайлтаа өөрчилж үзнэ үү.</p>}
        </section>

        <aside className="side">
          <LoyaltyCard />
          <div className="panel">
            <h3>Топ тоглогчид</h3>
            {top.length ? (
              <ol className="rank">
                {top.map((p, i) => (
                  <li key={i}><span>{i + 1}</span><b>{p.username}</b><em>{p.lifetime_points}</em></li>
                ))}
              </ol>
            ) : <p className="muted">Эхний захиалгаа өгч жагсаалтад орно уу.</p>}
          </div>
        </aside>
      </div>

      {open && <TopUpModal game={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
