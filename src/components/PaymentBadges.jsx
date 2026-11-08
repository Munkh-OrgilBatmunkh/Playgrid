// Төлбөрийн хэрэгслүүдийг харуулах жижиг тэмдэг. Албан ёсны лого биш, текст тэмдэг.
export default function PaymentBadges({ label = true, size = 'md' }) {
  return (
    <span className={`pay-badges ${size}`}>
      {label && <span className="pay-label">Төлбөрийн хэрэгсэл:</span>}
      <span className="pay-badge qpay" title="QPay QR">QPay</span>
      <span className="pay-badge">Visa</span>
      <span className="pay-badge">Mastercard</span>
    </span>
  )
}
