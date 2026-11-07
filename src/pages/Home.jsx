import { useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import FeaturedCarousel from '../components/FeaturedCarousel'
import GameCard from '../components/GameCard'
import TopUpModal from '../components/TopUpModal'
import LoyaltyCard from '../components/LoyaltyCard'

const CATEGORIES = ['Бүгд', 'PC', 'Mobile', 'Coupon']

export default function Home() {
  const [games, setGames] = useState([])
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
  }, [])

  const featured = games.filter((g) => g.is_featured)

  const visible = useMemo(
    () => games.filter((g) => (cat === 'Бүгд' || g.category === cat) && g.title.toLowerCase().includes(query.toLowerCase())),
    [games, cat, query]
  )

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

      <FeaturedCarousel games={featured} onOpen={setOpen} />

      <div className="layout" id="games">
        <section>
          <div className="section-head"><h2>Бүх бүтээгдэхүүн</h2></div>
          <div className="filters">
            <input className="input search" placeholder="Тоглоом хайх…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {CATEGORIES.map((c) => (
              <button key={c} className={c === cat ? 'chip on' : 'chip'} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="grid">
            {visible.map((g, i) => <GameCard key={g.id} game={g} index={i} onOpen={setOpen} />)}
          </div>
          {isConfigured && !visible.length && <p className="muted empty">Тохирох бүтээгдэхүүн олдсонгүй. Хайлтаа өөрчилж үзнэ үү.</p>}
        </section>

        <aside className="side">
          <LoyaltyCard />
        </aside>
      </div>

      {open && <TopUpModal game={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
