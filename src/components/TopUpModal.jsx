import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { money } from '../lib/format'
import { getTier } from '../lib/loyalty'

export default function TopUpModal({ game, onClose }) {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const products = [...(game.products || [])].sort((a, b) => a.price - b.price)
  const [productId, setProductId] = useState(products[0]?.id)
  const [account, setAccount] = useState('')
  const [usePoints, setUsePoints] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const product = products.find((p) => p.id === productId)
  const available = profile?.points ?? 0
  const pointsToUse = usePoints && product ? Math.min(available, product.price) : 0
  const total = product ? product.price - pointsToUse : 0
  const mult = getTier(profile?.lifetime_points).current.mult
  const willEarn = Math.floor((total / 100) * mult)

  async function submit() {
    setError('')
    setBusy(true)
    const { data, error } = await supabase.rpc('place_order', {
      p_product_id: productId,
      p_game_account: account,
      p_use_points: pointsToUse,
    })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(data)
    refreshProfile()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={onClose} aria-label="Хаах">×</button>

        {done ? (
          <div className="success">
            <div className="tick">✓</div>
            <h2>Захиалга амжилттай</h2>
            <p className="muted">{done.product_title}</p>
            <div className="code">{done.delivery_code}</div>
            <p className="muted">+{done.points_earned} оноо таны данс руу нэмэгдлээ.</p>
            <button className="btn btn-lime" onClick={onClose}>Хаах</button>
          </div>
        ) : (
          <>
            <h2>{game.title}</h2>
            <p className="muted">{game.description}</p>

            <h4>1. Багц сонгох</h4>
            <div className="packs">
              {products.map((p) => (
                <button key={p.id} className={p.id === productId ? 'pack on' : 'pack'} onClick={() => setProductId(p.id)}>
                  <b>{p.title}</b>
                  <span>{money(p.price)}</span>
                </button>
              ))}
            </div>

            <h4>2. Тоглогчийн ID</h4>
            <input className="input" placeholder="Жишээ: Player#1234" value={account} onChange={(e) => setAccount(e.target.value)} />

            {user ? (
              <>
                <label className="check">
                  <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} disabled={!available} />
                  Оноо ашиглах (боломжит: {available} оноо = {money(available)})
                </label>
                <div className="summary">
                  <div><span>Үнэ</span><b>{money(product?.price)}</b></div>
                  {pointsToUse > 0 && <div><span>Оноогоор хөнгөлсөн</span><b>−{money(pointsToUse)}</b></div>}
                  <div className="sum-total"><span>Төлөх дүн</span><b>{money(total)}</b></div>
                  <div><span>Авах оноо ({mult}x)</span><b className="lime-text">+{willEarn}</b></div>
                </div>
                {error && <p className="error">{error}</p>}
                <button className="btn btn-lime btn-block" disabled={busy || !account.trim()} onClick={submit}>
                  {busy ? 'Боловсруулж байна…' : 'Захиалах'}
                </button>
              </>
            ) : (
              <div className="login-hint">
                <p>Оноо цуглуулж, захиалгаа хадгалахын тулд нэвтэрнэ үү.</p>
                <button className="btn btn-lime btn-block" onClick={() => navigate('/login')}>Нэвтрэх / Бүртгүүлэх</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
