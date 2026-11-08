export default function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const nums = [...set].sort((a, b) => a - b)
  const items = []
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) items.push('…' + n)
    items.push(n)
  })
  return (
    <nav className="pager" aria-label="Хуудаслалт">
      <button className="pg" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Өмнөх">‹</button>
      {items.map((n) => typeof n === 'string'
        ? <span key={n} className="pg-gap">…</span>
        : <button key={n} className={n === page ? 'pg on' : 'pg'} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>)}
      <button className="pg" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Дараагийн">›</button>
    </nav>
  )
}
