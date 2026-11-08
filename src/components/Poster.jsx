import { useEffect, useState } from 'react'
import { imageUrl } from '../lib/storage'

// Зургийг Supabase Storage-оос уншина. Зураг байхгүй/ачаалагдаагүй бол градиент + нэр харуулна.
const GRADIENTS = [
  'linear-gradient(135deg,#1a1a1a,#3b4a0a)',
  'linear-gradient(135deg,#0f2027,#2c5364)',
  'linear-gradient(135deg,#2b1055,#7597de)',
  'linear-gradient(135deg,#232526,#6b6b6b)',
]

export default function Poster({ path, title, seed = 0, className = '' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [path])
  const url = imageUrl(path)
  if (failed || !url) {
    return (
      <div className={`poster poster-fallback ${className}`} style={{ background: GRADIENTS[seed % GRADIENTS.length] }}>
        <span>{title}</span>
      </div>
    )
  }
  return <img className={`poster ${className}`} src={url} alt={title} onError={() => setFailed(true)} loading="lazy" />
}
