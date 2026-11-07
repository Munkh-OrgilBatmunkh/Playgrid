import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { money } from '../lib/format'
import { getTier } from '../lib/loyalty'
import PaymentStep from './PaymentStep'

export default function TopUpModal({ game, onClose }) {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const products = [...(game.products || [])].sort((a, b) => a.price - b.price)
  const [step, setStep] = useState('select') // select → pay → done
  const [productId, setProductId] = useState(products[0]?.id)
  const [account, setAccount] = useState('')
  const [touched, setTouched] = useState(false)
  const [usePoints, setUsePoints] = useState(false)
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const needsId = Boolean(game.id_pattern)
  const idOk = !needsId || new RegExp(game.id_pattern).test(account.trim())
  const product = products.find((p) => p.id === productId)
  const available = profile?.points ?? 0
  const pointsToUse = usePoints && product ? Math.min(available, product.price) : 0
  const total = product ? product.price - pointsToUse : 0
  const mult = getTier(profile?.lifetime_points).current.mult
  const willEarn = Math.floor((total / 100) * mult)

  function close() {
    if (step === 'pay' && order) supabase.rpc('cancel_order', { p_order_id: order.id }) // төлөөгүй захиалгыг цуцална
    onClose()
  }

  async function createOrder() {
    setTouched(true)
    if (!idOk) return
    setError(''); setBusy(true)
    const { data, error } = await supabase.rpc('create_order', {
      p_product_id: productId,
      p_game_account: account,
      p_use_points: pointsToUse,
    })
    if (error) { setBusy(false); return setError(error.message) }
    setOrder(data)
    if (data.total === 0) {
      // Оноогоор бүрэн төлөгдөж байвал төлбөрийн алхамыг алгасна
      const res = await supabase.rpc('confirm_payment', { p_order_id: data.id, p_method: 'points' })
      setBusy(false)
      if (res.error) return setError(res.error.message)
      return paid(res.data)
    }
    setBusy(false)
    setStep('pay')
  }

  function paid(finalOrder) {
    setOrder(finalOrder)
    setStep('done')
    refreshProfile()
  }

  async function backToSelect() {
    if (order) await supabase.rpc('cancel_order', { p_order_id: order.id })
    setOrder(null)
    setStep('select')
  }

  return (
    <div className="overlay" onClick={step === 'pay' ? undefined : close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-x" onClick={close} aria-label="Хаах">×</button>

        {step === 'done' && order && (
          <div className="success">
            <div className="tick">✓</div>
            <h2>Төлбөр амжилттай</h2>
            <p className="muted">{order.product_title}</p>
            <small className="muted">{game.category === 'Coupon' ? 'Таны купон код' : 'Захиалгын код'}</small>
            <div className="code">{order.delivery_code}</div>
            <p className="muted">+{order.points_earned} оноо таны данс руу нэмэгдлээ.</p>
            <button className="btn btn-lime" onClick={onClose}>Хаах</button>
          </div>
        )}

        {step === 'pay' && order && <PaymentStep order={order} onPaid={paid} onBack={backToSelect} />}

        {step === 'select' && (
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

            {needsId && (
              <>
                <h4>2. {game.id_label}</h4>
                <input
                  className="input"
                  placeholder={`Жишээ: ${game.id_placeholder}`}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !idOk}
                />
                {touched && !idOk
                  ? <small className="error">{game.id_label} буруу форматтай байна. Жишээ: {game.id_placeholder}</small>
                  : <small className="muted">{game.id_hint}</small>}
              </>
            )}

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
                <button className="btn btn-lime btn-block" disabled={busy || (needsId && !account.trim())} onClick={createOrder}>
                  {busy ? 'Түр хүлээнэ үү…' : total === 0 ? 'Оноогоор авах' : 'Төлбөр төлөх →'}
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
