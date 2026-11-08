import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { money } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/States'

const validate = (f) => {
  const e = {}
  if (f.title.trim().length < 1 || f.title.trim().length > 40) e.title = 'Нэр 1–40 тэмдэгт'
  const p = Number(f.price)
  if (!Number.isInteger(p) || p < 1 || p > 10000000) e.price = 'Үнэ 1–10,000,000 бүхэл тоо'
  return e
}

// Тоглоомын багцууд (products): 1:N — CRUD
export default function ProductsManager({ gameId }) {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [draft, setDraft] = useState({ title: '', price: '' })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [edit, setEdit] = useState({ title: '', price: '', is_active: true })
  const [editErr, setEditErr] = useState({})
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => supabase.from('products').select('*').eq('game_id', gameId).order('price').then(({ data, error }) => (error ? toast.error(error.message) : setRows(data)))
  useEffect(() => { load() }, [gameId])

  async function add(e) {
    e.preventDefault()
    const er = validate(draft); setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    const { error } = await supabase.from('products').insert({ game_id: gameId, title: draft.title.trim(), price: Number(draft.price) })
    setBusy(false)
    if (error) return toast.error(error.message)
    setDraft({ title: '', price: '' }); toast.success('Багц нэмэгдлээ'); load()
  }

  async function saveEdit() {
    const er = validate(edit); setEditErr(er)
    if (Object.keys(er).length) return
    const { error } = await supabase.from('products').update({ title: edit.title.trim(), price: Number(edit.price), is_active: edit.is_active }).eq('id', editId)
    if (error) return toast.error(error.message)
    setEditId(null); toast.success('Багц шинэчлэгдлээ'); load()
  }

  async function remove() {
    setBusy(true)
    const { error } = await supabase.from('products').delete().eq('id', target.id)
    setBusy(false)
    if (error) return toast.error(error.message)
    setTarget(null); toast.success('Багц устгагдлаа'); load()
  }

  return (
    <div className="panel">
      <h3>Багцууд (products)</h3>
      {rows === null ? <PageLoader /> : (
        <table className="table">
          <thead><tr><th>Нэр</th><th>Үнэ</th><th>Идэвхтэй</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => editId === p.id ? (
              <tr key={p.id}>
                <td><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />{editErr.title && <small className="error">{editErr.title}</small>}</td>
                <td><input className="input" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} />{editErr.price && <small className="error">{editErr.price}</small>}</td>
                <td><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /></td>
                <td className="right-cell"><button className="btn btn-lime btn-sm" onClick={saveEdit}>Хадгалах</button> <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>Болих</button></td>
              </tr>
            ) : (
              <tr key={p.id}>
                <td>{p.title}</td><td>{money(p.price)}</td>
                <td><span className={p.is_active ? 'badge-s ok' : 'badge-s off'}>{p.is_active ? 'Тийм' : 'Үгүй'}</span></td>
                <td className="right-cell"><button className="btn btn-outline btn-sm" onClick={() => { setEditId(p.id); setEdit({ title: p.title, price: p.price, is_active: p.is_active }); setEditErr({}) }}>Засах</button> <button className="btn btn-danger-o btn-sm" onClick={() => setTarget(p)}>Устгах</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="4" className="muted">Багц алга. Доороос нэмнэ үү.</td></tr>}
          </tbody>
        </table>
      )}
      <form className="inline-form" onSubmit={add} noValidate>
        <div><input className="input" placeholder="Багцын нэр (ж: 475 VP)" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />{errors.title && <small className="error">{errors.title}</small>}</div>
        <div><input className="input" type="number" min="1" placeholder="Үнэ ₮" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />{errors.price && <small className="error">{errors.price}</small>}</div>
        <button className="btn btn-lime" disabled={busy}>+ Багц нэмэх</button>
      </form>
      <ConfirmDialog open={Boolean(target)} busy={busy} title="Багц устгах уу?" message={`«${target?.title}» багцыг устгана. Энэ үйлдлийг буцаах боломжгүй.`} onConfirm={remove} onCancel={() => setTarget(null)} />
    </div>
  )
}
