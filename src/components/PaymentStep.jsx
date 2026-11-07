import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { money } from '../lib/format'
import { cardBrand, expiryValid, formatCard, formatExpiry, luhn } from '../lib/payment'

const QR_SECONDS = 300 // QR кодын хүчинтэй хугацаа: 5 минут

export default function PaymentStep({ order, onPaid, onBack }) {
  const [method, setMethod] = useState('qpay')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // ---- QPay QR ----
  const [qr, setQr] = useState('')
  const [left, setLeft] = useState(QR_SECONDS)
  useEffect(() => {
    // Бодит QPay-д банкнаас ирсэн invoice QR энд орно. Демо: захиалгын лавлах дугаар.
    QRCode.toDataURL(`playgrid-pay://${order.payment_ref}?amount=${order.total}`, { width: 220, margin: 1 }).then(setQr)
  }, [order])
  useEffect(() => {
    if (method !== 'qpay') return
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [method])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  // ---- Карт ----
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [touched, setTouched] = useState(false)
  const brand = cardBrand(card.number)
  const errs = {
    number: luhn(card.number) ? '' : 'Картын дугаар буруу байна',
    name: card.name.trim().length >= 3 ? '' : 'Картан дээрх нэрийг оруулна уу',
    expiry: expiryValid(card.expiry) ? '' : 'Хугацаа буруу (СС/ЖЖ)',
    cvc: /^\d{3,4}$/.test(card.cvc) ? '' : 'CVC 3–4 орон',
  }
  const cardValid = Object.values(errs).every((e) => !e)

  async function confirm(m) {
    setError(''); setBusy(true)
    const { data, error } = await supabase.rpc('confirm_payment', { p_order_id: order.id, p_method: m })
    setBusy(false)
    if (error) return setError(error.message)
    setCard({ number: '', name: '', expiry: '', cvc: '' }) // картын мэдээллийг санах ойгоос цэвэрлэнэ
    onPaid(data)
  }

  async function payCard(e) {
    e.preventDefault()
    setTouched(true)
    if (!cardValid) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 1500)) // төлбөрийн сүлжээтэй холбогдож буй дүр (демо)
    setBusy(false)
    confirm('card')
  }

  const set = (k, f = (v) => v) => (e) => setCard({ ...card, [k]: f(e.target.value) })
  const Err = ({ k }) => (touched && errs[k] ? <small className="error">{errs[k]}</small> : null)

  return (
    <>
      <button className="link back" onClick={onBack}>← Буцах</button>
      <h2>Төлбөр төлөх</h2>
      <div className="pay-amount"><span className="muted">{order.product_title}</span><b>{money(order.total)}</b></div>

      <div className="pay-tabs" role="tablist">
        <button role="tab" aria-selected={method === 'qpay'} className={method === 'qpay' ? 'pay-tab on' : 'pay-tab'} onClick={() => setMethod('qpay')}>QPay QR</button>
        <button role="tab" aria-selected={method === 'card'} className={method === 'card' ? 'pay-tab on' : 'pay-tab'} onClick={() => setMethod('card')}>Банкны карт</button>
      </div>

      {method === 'qpay' ? (
        <div className="qr">
          {qr ? <img src={qr} alt="Төлбөрийн QR код" /> : <div className="qr-ph" />}
          <p className="muted center">Банкны аппаараа QR кодыг уншуулж төлнө үү.</p>
          <div className="timer">{left > 0 ? `${mm}:${ss}` : 'Хугацаа дууслаа'}</div>
          <button className="btn btn-lime btn-block" disabled={busy || left === 0} onClick={() => confirm('qpay')}>
            {busy ? 'Шалгаж байна…' : 'Төлбөр төлөгдсөн (демо)'}
          </button>
        </div>
      ) : (
        <form className="card-form" onSubmit={payCard} noValidate>
          <div className="full">
            <input className="input" inputMode="numeric" autoComplete="cc-number" placeholder="Картын дугаар" value={card.number} onChange={set('number', formatCard)} />
            {brand && <small className="muted">{brand}</small>} <Err k="number" />
          </div>
          <div className="full">
            <input className="input" autoComplete="cc-name" placeholder="Карт эзэмшигчийн нэр" value={card.name} onChange={set('name')} />
            <Err k="name" />
          </div>
          <div>
            <input className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="СС/ЖЖ" value={card.expiry} onChange={set('expiry', formatExpiry)} />
            <Err k="expiry" />
          </div>
          <div>
            <input className="input" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" maxLength={4} value={card.cvc} onChange={set('cvc', (v) => v.replace(/\D/g, ''))} />
            <Err k="cvc" />
          </div>
          <button className="btn btn-lime btn-block full" disabled={busy}>{busy ? 'Боловсруулж байна…' : `${money(order.total)} төлөх`}</button>
          <small className="muted full">Туршихад: 4242 4242 4242 4242, ирээдүйн хугацаа, дурын CVC.</small>
        </form>
      )}

      {error && <p className="error">{error}</p>}
      <div className="demo-note">Туршилтын горим: жинхэнэ мөнгө шилжихгүй. Картын мэдээлэл хөтөч дээр шалгагдаад хаагдана, хадгалагдахгүй.</div>
    </>
  )
}
