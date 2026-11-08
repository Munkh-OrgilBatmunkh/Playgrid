import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { removeImages, uploadImage } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'
import ImageUpload from '../../components/ui/ImageUpload'
import ProductsManager from './ProductsManager'
import { ErrorState, PageLoader } from '../../components/ui/States'

const BLANK = { title: '', slug: '', category_id: '', description: '', currency_name: '', id_label: '', id_placeholder: '', id_hint: '', id_pattern: '', is_featured: false, is_active: true, sort_order: 0 }

function validate(f) {
  const e = {}
  const t = f.title.trim()
  if (t.length < 2 || t.length > 60) e.title = 'Нэр 2–60 тэмдэгт байна'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug) || f.slug.length > 40) e.slug = 'Slug: жижиг латин үсэг, тоо, дундуур зураас (ж: pubg-mobile)'
  if (!f.category_id) e.category_id = 'Категори сонгоно уу'
  if (f.description.length > 200) e.description = 'Тайлбар 200 тэмдэгтээс хэтрэхгүй'
  if (!f.currency_name.trim()) e.currency_name = 'Валютын нэр оруулна уу (ж: VP, UC)'
  if (!Number.isInteger(Number(f.sort_order)) || Number(f.sort_order) < 0) e.sort_order = 'Эрэмбэ 0 буюу түүнээс их бүхэл тоо'
  if (f.id_pattern.trim()) {
    try { new RegExp(f.id_pattern) } catch { e.id_pattern = 'Regex буруу байна' }
    if (!f.id_label.trim()) e.id_label = 'ID-ийн нэр шаардлагатай'
    if (!f.id_placeholder.trim()) e.id_placeholder = 'ID-ийн жишээ шаардлагатай'
  }
  return e
}

export default function GameForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(BLANK)
  const [game, setGame] = useState(null)        // хадгалагдсан мөр (зургийн замтай)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [tagIds, setTagIds] = useState(new Set())
  const [coverFile, setCoverFile] = useState(null)
  const [posterFile, setPosterFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoadError('')
    const [cats, tg] = await Promise.all([supabase.from('categories').select('*').order('sort_order'), supabase.from('tags').select('*').order('name')])
    setCategories(cats.data || []); setTags(tg.data || [])
    if (isNew) return
    const [g, gt] = await Promise.all([supabase.from('games').select('*').eq('id', id).maybeSingle(), supabase.from('game_tags').select('tag_id').eq('game_id', id)])
    if (g.error || !g.data) { setLoadError(g.error?.message || 'Тоглоом олдсонгүй'); setLoading(false); return }
    setGame(g.data)
    setForm({ ...BLANK, ...Object.fromEntries(Object.entries(g.data).map(([k, v]) => [k, v ?? BLANK[k] ?? ''])), category_id: String(g.data.category_id) })
    setTagIds(new Set((gt.data || []).map((r) => r.tag_id)))
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const toggleTag = (tid) => setTagIds((s) => { const n = new Set(s); n.has(tid) ? n.delete(tid) : n.add(tid); return n })

  async function save(ev) {
    ev.preventDefault()
    const er = validate(form); setErrors(er)
    if (Object.keys(er).length) return toast.error('Формын алдааг засна уу')
    setBusy(true)
    const uploaded = []
    try {
      let cover_path = game?.cover_path ?? null
      let poster_path = game?.poster_path ?? null
      // Зургийг Supabase Storage руу байршуулна
      if (coverFile)  { const p = await uploadImage(coverFile, 'covers', form.slug);  uploaded.push(p); cover_path = p }
      if (posterFile) { const p = await uploadImage(posterFile, 'posters', form.slug); uploaded.push(p); poster_path = p }

      const payload = {
        title: form.title.trim(), slug: form.slug.trim(), category_id: Number(form.category_id),
        description: form.description.trim() || null, currency_name: form.currency_name.trim(),
        id_label: form.id_label.trim() || null, id_placeholder: form.id_placeholder.trim() || null,
        id_hint: form.id_hint.trim() || null, id_pattern: form.id_pattern.trim() || null,
        is_featured: form.is_featured, is_active: form.is_active, sort_order: Number(form.sort_order), cover_path, poster_path,
      }
      let gameId = id
      if (isNew) {
        const { data, error } = await supabase.from('games').insert(payload).select('id').single()
        if (error) throw error
        gameId = data.id
      } else {
        const { error } = await supabase.from('games').update(payload).eq('id', id)
        if (error) throw error
      }
      // N:M холбоо (game_tags): хуучныг арилгаад шинээр бичнэ
      await supabase.from('game_tags').delete().eq('game_id', gameId)
      if (tagIds.size) {
        const { error } = await supabase.from('game_tags').insert([...tagIds].map((tag_id) => ({ game_id: gameId, tag_id })))
        if (error) throw error
      }
      // Шинэ зураг орсон бол хуучныг Storage-оос устгана
      if (coverFile && game?.cover_path) removeImages([game.cover_path])
      if (posterFile && game?.poster_path) removeImages([game.poster_path])
      toast.success(isNew ? 'Тоглоом нэмэгдлээ' : 'Өөрчлөлт хадгалагдлаа')
      setCoverFile(null); setPosterFile(null)
      if (isNew) navigate(`/admin/games/${gameId}`, { replace: true }); else load()
    } catch (e) {
      removeImages(uploaded) // алдаа гарвал шинээр орсон зургийг цэвэрлэнэ
      if (e.code === '23505') setErrors({ slug: 'Энэ slug аль хэдийн ашиглагдсан байна' })
      toast.error(e.code === '23505' ? 'Slug давхцаж байна' : e.message || 'Хадгалж чадсангүй')
    }
    setBusy(false)
  }

  if (loading) return <PageLoader />
  if (loadError) return <ErrorState message={loadError} onRetry={load} />

  const err = (k) => errors[k] && <small className="error">{errors[k]}</small>

  return (
    <>
      <div className="head-row"><h1 className="h1-sm">{isNew ? 'Шинэ тоглоом' : `Засах: ${game?.title}`}</h1><Link to="/admin/games" className="btn btn-outline">← Жагсаалт</Link></div>

      <form className="panel game-form" onSubmit={save} noValidate>
        <div className="form-cols">
          <div className="form-fields">
            <div><label className="lbl">Нэр *</label><input className="input" value={form.title} onChange={set('title')} aria-invalid={Boolean(errors.title)} />{err('title')}</div>
            <div className="form-grid">
              <div><label className="lbl">Slug *</label><input className="input" value={form.slug} onChange={set('slug')} placeholder="pubg-mobile" aria-invalid={Boolean(errors.slug)} />{err('slug')}</div>
              <div><label className="lbl">Категори *</label>
                <select className="input" value={form.category_id} onChange={set('category_id')} aria-invalid={Boolean(errors.category_id)}>
                  <option value="">Сонгох…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>{err('category_id')}</div>
            </div>
            <div><label className="lbl">Тайлбар</label><textarea className="input" rows="2" value={form.description} onChange={set('description')} />{err('description')}</div>
            <div className="form-grid">
              <div><label className="lbl">Валютын нэр *</label><input className="input" value={form.currency_name} onChange={set('currency_name')} placeholder="VP" />{err('currency_name')}</div>
              <div><label className="lbl">Эрэмбэ</label><input className="input" type="number" min="0" value={form.sort_order} onChange={set('sort_order')} />{err('sort_order')}</div>
            </div>
            <div><label className="lbl">Төрөл (tags)</label><div className="chips">{tags.map((t) => <button type="button" key={t.id} className={tagIds.has(t.id) ? 'chip on' : 'chip'} onClick={() => toggleTag(t.id)}>{t.name}</button>)}</div></div>
            <div className="checks">
              <label className="check"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Идэвхтэй (зочдод харагдана)</label>
              <label className="check"><input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Нүүрний carousel-д оруулах</label>
            </div>
          </div>
          <div className="form-images">
            <ImageUpload label="Картын зураг (3:4)" ratio="285/380" currentPath={game?.cover_path} file={coverFile} onChange={setCoverFile} />
            <ImageUpload label="Carousel постер (8:3)" ratio="8/3" currentPath={game?.poster_path} file={posterFile} onChange={setPosterFile} hint="Зөвлөмж: 1600×600 · JPG, PNG, WebP · ≤ 2MB" />
          </div>
        </div>

        <h3>Тоглогчийн ID формат</h3>
        <p className="muted">Хоосон орхивол ID шаардахгүй (купонд тохиромжтой).</p>
        <div className="form-grid">
          <div><label className="lbl">ID-ийн нэр</label><input className="input" value={form.id_label} onChange={set('id_label')} placeholder="Riot ID" />{err('id_label')}</div>
          <div><label className="lbl">Жишээ</label><input className="input" value={form.id_placeholder} onChange={set('id_placeholder')} placeholder="Saku#0001" />{err('id_placeholder')}</div>
          <div><label className="lbl">Тайлбар</label><input className="input" value={form.id_hint} onChange={set('id_hint')} /></div>
          <div><label className="lbl">Шалгах regex</label><input className="input mono" value={form.id_pattern} onChange={set('id_pattern')} placeholder="^[^#]{3,16}#[A-Za-z0-9]{3,5}$" />{err('id_pattern')}</div>
        </div>

        <div className="actions"><button className="btn btn-lime" disabled={busy}>{busy ? 'Хадгалж байна…' : 'Хадгалах'}</button></div>
      </form>

      {!isNew && <ProductsManager gameId={Number(id)} />}
      {isNew && <p className="muted">Багц нэмэхийн тулд эхлээд тоглоомыг хадгална уу.</p>}
    </>
  )
}
