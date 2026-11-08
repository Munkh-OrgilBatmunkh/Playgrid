import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { removeImages } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'
import useDebounce from '../../hooks/useDebounce'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Poster from '../../components/Poster'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States'

const PAGE = 10

export default function AdminGames() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [target, setTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const dq = useDebounce(q)

  useEffect(() => {
    let cancelled = false
    setError('')
    let query = supabase.from('games').select('id,slug,title,is_active,is_featured,sort_order,cover_path,poster_path,created_at,categories(name)', { count: 'exact' })
    const t = dq.trim().replace(/[%_\\]/g, (m) => '\\' + m)
    if (t) query = query.ilike('title', `%${t}%`)
    if (status) query = query.eq('is_active', status === 'active')
    query.order('sort_order').order('id').range((page - 1) * PAGE, page * PAGE - 1).then(({ data, count, error }) => {
      if (cancelled) return
      if (error) setError(error.message); else { setRows(data); setTotal(count ?? 0) }
    })
    return () => { cancelled = true }
  }, [dq, status, page, reload])

  // DELETE: эхлээд Storage-ийн зургийг, дараа нь мөрийг устгана
  async function confirmDelete() {
    setDeleting(true)
    await removeImages([target.cover_path, target.poster_path])
    const { error } = await supabase.from('games').delete().eq('id', target.id)
    setDeleting(false)
    if (error) return toast.error(error.message)
    toast.success(`«${target.title}» устгагдлаа`)
    setTarget(null)
    if (rows.length === 1 && page > 1) setPage(page - 1); else setReload((n) => n + 1)
  }

  return (
    <>
      <div className="head-row"><h1 className="h1-sm">Тоглоомууд</h1><Link to="/admin/games/new" className="btn btn-lime">+ Шинэ тоглоом</Link></div>
      <div className="filters">
        <input className="input search" type="search" placeholder="Нэрээр хайх…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <select className="input select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Бүх төлөв</option><option value="active">Идэвхтэй</option><option value="hidden">Нуугдсан</option>
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />
        : rows === null ? <PageLoader />
        : !rows.length ? <EmptyState title="Тоглоом олдсонгүй" text="Хайлтаа өөрчилнө үү эсвэл шинэ тоглоом нэмнэ үү." />
        : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th></th><th>Нэр</th><th>Категори</th><th>Төлөв</th><th>Эрэмбэ</th><th></th></tr></thead>
              <tbody>
                {rows.map((g, i) => (
                  <tr key={g.id}>
                    <td><Poster className="thumb" path={g.cover_path} title={g.title} seed={i} /></td>
                    <td><b>{g.title}</b><small className="muted block">{g.slug}</small></td>
                    <td>{g.categories?.name}</td>
                    <td><span className={g.is_active ? 'badge-s ok' : 'badge-s off'}>{g.is_active ? 'Идэвхтэй' : 'Нуугдсан'}</span>{g.is_featured && <span className="badge-s feat">Онцлох</span>}</td>
                    <td>{g.sort_order}</td>
                    <td className="right-cell"><Link className="btn btn-outline btn-sm" to={`/admin/games/${g.id}`}>Засах</Link> <button className="btn btn-danger-o btn-sm" onClick={() => setTarget(g)}>Устгах</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Pagination page={page} total={total} pageSize={PAGE} onChange={setPage} />

      <ConfirmDialog open={Boolean(target)} busy={deleting} title="Тоглоом устгах уу?"
        message={`«${target?.title}» болон түүний бүх багц, зураг устгагдана. Өмнөх захиалгын түүх хэвээр үлдэнэ. Энэ үйлдлийг буцаах боломжгүй.`}
        onConfirm={confirmDelete} onCancel={() => setTarget(null)} />
    </>
  )
}
