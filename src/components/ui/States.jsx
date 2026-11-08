// Ачаалж буй / хоосон / алдааны төлвүүд
export const PageLoader = () => (
  <div className="state"><div className="spinner" aria-label="Ачаалж байна" /><p className="muted">Ачаалж байна…</p></div>
)

export const CardSkeleton = () => (
  <div className="card skeleton" aria-hidden="true"><div className="sk sk-img" /><div className="card-body"><div className="sk sk-line w40" /><div className="sk sk-line" /><div className="sk sk-line w70" /></div></div>
)

export const EmptyState = ({ title = 'Илэрц олдсонгүй', text, action }) => (
  <div className="state"><div className="state-ico">🔎</div><h3>{title}</h3>{text && <p className="muted">{text}</p>}{action}</div>
)

export const ErrorState = ({ message, onRetry }) => (
  <div className="state state-error"><div className="state-ico">⚠️</div><h3>Алдаа гарлаа</h3><p className="muted">{message}</p>{onRetry && <button className="btn btn-outline" onClick={onRetry}>Дахин оролдох</button>}</div>
)
