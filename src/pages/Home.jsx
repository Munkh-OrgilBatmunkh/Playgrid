import { useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import useDebounce from '../hooks/useDebounce'
import FeaturedCarousel from '../components/FeaturedCarousel'
import GameCard from '../components/GameCard'
import TopUpModal from '../components/TopUpModal'
import LoyaltyCard from '../components/LoyaltyCard'
import PaymentBadges from '../components/PaymentBadges'
import Pagination from '../components/ui/Pagination'
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States'

const PAGE_SIZE = 8
const SORTS = {
  sort_order: { label: 'Онцлох', col: 'sort_order', asc: true },
  newest: { label: 'Шинэ нь эхэнд', col: 'created_at', asc: false },
  name: { label: 'Нэрээр (А–Я)', col: 'title', asc: true },
  price_asc: { label: 'Үнэ: багаас их', col: 'min_price', asc: true },
  price_desc: { label: 'Үнэ: ихээс бага', col: 'min_price', asc: false },
}
const EMPTY_FILTERS = {
  q: '',
  category: '',
  tag: '',
  min: '',
  max: '',
  sort: 'sort_order',
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [open, setOpen] = useState(null)

  const f = useDebounce(filters, 350) // хайлт бичиж байхад хүсэлт бүр дээр дуудахгүй
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  // Нэг удаа: онцлох тоглоом, категори, tag
  useEffect(() => {
    if (!isConfigured) return
    supabase
      .from('game_catalog')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order')
      .then(({ data }) => setFeatured(data || []))
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data || []))
    supabase
      .from('tags')
      .select('*')
      .order('name')
      .then(({ data }) => setTags(data || []))
  }, [])

  // Хайлт, шүүлт, эрэмбэ, хуудаслалт — бүгд серверт (Supabase query)
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      let query = supabase
        .from('game_catalog')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
      const q = f.q.trim().replace(/[%_\\]/g, (m) => '\\' + m)
      if (q) query = query.ilike('title', `%${q}%`)
      if (f.category) query = query.eq('category_id', f.category)
      if (f.tag) query = query.contains('tag_ids', [Number(f.tag)])
      if (f.min !== '') query = query.gte('min_price', Number(f.min))
      if (f.max !== '') query = query.lte('min_price', Number(f.max))
      const s = SORTS[f.sort]
      query = query
        .order(s.col, { ascending: s.asc, nullsFirst: false })
        .order('id')
      const from = (page - 1) * PAGE_SIZE
      const { data, count, error } = await query.range(
        from,
        from + PAGE_SIZE - 1,
      )
      if (cancelled) return
      if (error) setError(error.message)
      else {
        setRows(data)
        setTotal(count ?? 0)
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [f, page, reload])

  const update = (patch) => {
    setFilters((cur) => ({ ...cur, ...patch }))
    setPage(1)
  }
  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  return (
    <main className="container">
      {!isConfigured && (
        <div className="notice">
          <b>Supabase холбогдоогүй байна.</b> <code>.env</code> файлд{' '}
          <code>VITE_SUPABASE_URL</code> болон{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>-г бөглөж, серверийг дахин ачаална
          уу.
        </div>
      )}

      <div className="page-title">
        <small className="muted">Тоглоомын кредит</small>
        <h1>Хурдан цэнэглэ. Оноо цуглуул.</h1>
        <p className="hero-sub">
          <span className="pay-badge qpay">QPay</span> QR-аар хурдан төл —
          банкны аппаараа уншуулаад л болоо.
        </p>
      </div>

      <FeaturedCarousel games={featured} onOpen={setOpen} />

      <div className="layout" id="games">
        <section>
          <div className="section-head">
            <h2>Бүх бүтээгдэхүүн</h2>
            {!loading && !error && (
              <span className="muted">{total} бүтээгдэхүүн</span>
            )}
          </div>

          <div className="filters">
            <input
              className="input search"
              type="search"
              placeholder="Нэрээр хайх…"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              aria-label="Хайх"
            />
            <select
              className="input select"
              value={filters.tag}
              onChange={(e) => update({ tag: e.target.value })}
              aria-label="Төрөл"
            >
              <option value="">Бүх төрөл</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
              aria-label="Эрэмбэ"
            >
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filters">
            <button
              className={!filters.category ? 'chip on' : 'chip'}
              onClick={() => update({ category: '' })}
            >
              Бүгд
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={
                  String(c.id) === filters.category ? 'chip on' : 'chip'
                }
                onClick={() => update({ category: String(c.id) })}
              >
                {c.name}
              </button>
            ))}
            <span className="price-range">
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Үнэ: доод ₮"
                value={filters.min}
                onChange={(e) => update({ min: e.target.value })}
                aria-label="Доод үнэ"
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="дээд ₮"
                value={filters.max}
                onChange={(e) => update({ max: e.target.value })}
                aria-label="Дээд үнэ"
              />
            </span>
            {active && (
              <button className="link" onClick={reset}>
                Шүүлт цэвэрлэх
              </button>
            )}
          </div>

          {error ? (
            <ErrorState
              message={error}
              onRetry={() => setReload((n) => n + 1)}
            />
          ) : loading ? (
            <div className="grid">
              {Array.from({ length: 8 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : !rows.length ? (
            <EmptyState
              title="Илэрц олдсонгүй"
              text="Хайлт, шүүлтээ өөрчлөөд дахин оролдоно уу."
              action={
                active && (
                  <button className="btn btn-outline" onClick={reset}>
                    Шүүлт цэвэрлэх
                  </button>
                )
              }
            />
          ) : (
            <div className="grid">
              {rows.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} onOpen={setOpen} />
              ))}
            </div>
          )}

          {!loading && !error && (
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={(p) => {
                setPage(p)
                document
                  .getElementById('games')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          )}
        </section>

        <aside className="side">
          <LoyaltyCard />
        </aside>
      </div>

      {open && <TopUpModal game={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
