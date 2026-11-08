import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useDebounce from '../../hooks/useDebounce'
import { getTier } from '../../lib/loyalty'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States'

const PAGE = 10

export default function AdminUsers() {
  const { user } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const dq = useDebounce(q)

  useEffect(() => {
    let cancelled = false
    setError('')
    let query = supabase.from('profiles').select('id,username,email,points,lifetime_points,is_admin,created_at', { count: 'exact' })
    const t = dq.trim().replace(/[,()%_\\]/g, ' ')
    if (t) query = query.or(`username.ilike.%${t}%,email.ilike.%${t}%`)
    query.order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1).then(({ data, count, error }) => {
      if (cancelled) return
      if (error) setError(error.message); else { setRows(data); setTotal(count ?? 0) }
    })
    return () => { cancelled = true }
  }, [dq, page, reload])

  async function toggleAdmin() {
    setBusy(true)
    const { error } = await supabase.rpc('set_user_admin', { p_user_id: target.id, p_value: !target.is_admin })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Эрх шинэчлэгдлээ'); setTarget(null); setReload((n) => n + 1)
  }

  return (
    <>
      <h1 className="h1-sm">Хэрэглэгчид</h1>
      <div className="filters"><input className="input search" type="search" placeholder="Нэр эсвэл и-мэйлээр хайх…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} /></div>
      {error ? <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />
        : rows === null ? <PageLoader />
        : !rows.length ? <EmptyState title="Хэрэглэгч олдсонгүй" />
        : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Хэрэглэгч</th><th>Түвшин</th><th>Оноо</th><th>Бүртгүүлсэн</th><th>Эрх</th><th></th></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.username}</b><small className="muted block">{u.email}</small></td>
                    <td>{getTier(u.lifetime_points).current.name}</td>
                    <td>{u.points}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('mn-MN')}</td>
                    <td><span className={u.is_admin ? 'badge-s feat' : 'badge-s off'}>{u.is_admin ? 'Админ' : 'Хэрэглэгч'}</span></td>
                    <td className="right-cell">{u.id !== user.id && <button className="btn btn-outline btn-sm" onClick={() => setTarget(u)}>{u.is_admin ? 'Админ хасах' : 'Админ болгох'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Pagination page={page} total={total} pageSize={PAGE} onChange={setPage} />
      <ConfirmDialog open={Boolean(target)} busy={busy} confirmText="Тийм, өөрчлөх" title="Эрх өөрчлөх үү?"
        message={target?.is_admin ? `«${target?.username}»-ийн админ эрхийг хасна.` : `«${target?.username}»-д админ эрх олгоно. Тэр бүх өгөгдлийг удирдах боломжтой болно.`}
        onConfirm={toggleAdmin} onCancel={() => setTarget(null)} />
    </>
  )
}
