import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { money } from '../../lib/format'
import useDebounce from '../../hooks/useDebounce'
import Pagination from '../../components/ui/Pagination'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States'

const PAGE = 10
const STATUS = { pending: 'Хүлээгдэж буй', completed: 'Төлөгдсөн', cancelled: 'Цуцлагдсан' }
const METHOD = { qpay: 'QPay', card: 'Карт', points: 'Оноо' }

export default function AdminOrders() {
  const [f, setF] = useState({ q: '', status: '', from: '', to: '' })
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const df = useDebounce(f)

  useEffect(() => {
    let cancelled = false
    setError('')
    let query = supabase.from('orders').select('*, profiles(username,email)', { count: 'exact' })
    const t = df.q.trim().replace(/[,()%_\\]/g, ' ')
    if (t) query = query.or(`product_title.ilike.%${t}%,payment_ref.ilike.%${t}%`)
    if (df.status) query = query.eq('status', df.status)
    // Огноогоор шүүх (Улаанбаатарын цаг, UTC+8)
    if (df.from) query = query.gte('created_at', `${df.from}T00:00:00+08:00`)
    if (df.to) query = query.lte('created_at', `${df.to}T23:59:59+08:00`)
    query.order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1).then(({ data, count, error }) => {
      if (cancelled) return
      if (error) setError(error.message); else { setRows(data); setTotal(count ?? 0) }
    })
    return () => { cancelled = true }
  }, [df, page, reload])

  const upd = (patch) => { setF({ ...f, ...patch }); setPage(1) }
  const active = Object.values(f).some(Boolean)

  return (
    <>
      <h1 className="h1-sm">Захиалга</h1>
      <div className="filters">
        <input className="input search" type="search" placeholder="Бүтээгдэхүүн / баримтын дугаар…" value={f.q} onChange={(e) => upd({ q: e.target.value })} />
        <select className="input select" value={f.status} onChange={(e) => upd({ status: e.target.value })}>
          <option value="">Бүх төлөв</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="date-f">Эхлэх <input className="input" type="date" value={f.from} max={f.to || undefined} onChange={(e) => upd({ from: e.target.value })} /></label>
        <label className="date-f">Дуусах <input className="input" type="date" value={f.to} min={f.from || undefined} onChange={(e) => upd({ to: e.target.value })} /></label>
        {active && <button className="link" onClick={() => { setF({ q: '', status: '', from: '', to: '' }); setPage(1) }}>Цэвэрлэх</button>}
      </div>

      {error ? <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />
        : rows === null ? <PageLoader />
        : !rows.length ? <EmptyState title="Захиалга олдсонгүй" text="Шүүлтээ өөрчилж үзнэ үү." />
        : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Огноо</th><th>Хэрэглэгч</th><th>Бүтээгдэхүүн</th><th>Дүн</th><th>Төлбөр</th><th>Төлөв</th></tr></thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleString('mn-MN')}</td>
                    <td>{o.profiles?.username}<small className="muted block">{o.profiles?.email}</small></td>
                    <td>{o.product_title}<small className="muted block">{o.payment_ref}</small></td>
                    <td><b>{money(o.total)}</b></td>
                    <td>{METHOD[o.payment_method] || '—'}</td>
                    <td><span className={`badge-s st-${o.status}`}>{STATUS[o.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Pagination page={page} total={total} pageSize={PAGE} onChange={setPage} />
    </>
  )
}
