import { useEffect, useMemo, useState } from 'react'
import { IMAGE_TYPES, MAX_IMAGE_MB, imageUrl, validateImage } from '../../lib/storage'

// Зураг сонгоход БАЙРШУУЛАХААС ӨМНӨ урьдчилан харуулна; төрөл, хэмжээг шалгана.
export default function ImageUpload({ label, hint, currentPath, file, onChange, ratio = '3/4' }) {
  const [error, setError] = useState('')
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : imageUrl(currentPath)), [file, currentPath])
  useEffect(() => () => { if (file) URL.revokeObjectURL(preview) }, [file, preview])

  function pick(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const msg = validateImage(f)
    setError(msg)
    if (!msg) onChange(f)
  }

  return (
    <div className="upload">
      <label className="lbl">{label}</label>
      <div className="upload-box" style={{ aspectRatio: ratio }}>
        {preview ? <img src={preview} alt="Урьдчилан харах" /> : <span className="muted">Зураг сонгоогүй</span>}
      </div>
      <div className="upload-actions">
        <label className="btn btn-outline btn-sm">
          {preview ? 'Зураг солих' : 'Зураг сонгох'}
          <input type="file" accept={IMAGE_TYPES.join(',')} onChange={pick} hidden />
        </label>
        {file && <button type="button" className="link" onClick={() => { onChange(null); setError('') }}>Болих</button>}
      </div>
      <small className="muted">{hint || `JPG, PNG, WebP · дээд тал нь ${MAX_IMAGE_MB}MB`}</small>
      {error && <small className="error">{error}</small>}
    </div>
  )
}
