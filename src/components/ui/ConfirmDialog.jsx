// Устгахын өмнө баталгаажуулах цонх
export default function ConfirmDialog({ open, title, message, confirmText = 'Тийм, устгах', busy, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={busy ? undefined : onCancel}>
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>Болих</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Устгаж байна…' : confirmText}</button>
        </div>
      </div>
    </div>
  )
}
