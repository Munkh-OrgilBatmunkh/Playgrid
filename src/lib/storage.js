import { supabase } from './supabase'

// Тоглоомын зургийг Supabase Storage-ийн "game-images" bucket-д хадгална (SQL-д үүсгэсэн).
export const BUCKET = 'game-images'
export const MAX_IMAGE_MB = 2
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const imageUrl = (path) => (path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null)

// Оруулахаас өмнө хэмжээ, төрлийг шалгана (bucket дээр мөн ижил хязгаар тавьсан)
export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Зөвхөн JPG, PNG, WebP зураг оруулна уу'
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Зургийн хэмжээ ${MAX_IMAGE_MB}MB-аас их байна`
  return ''
}

export async function uploadImage(file, folder, slug) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${slug}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

export const removeImages = (paths) => {
  const list = paths.filter(Boolean)
  return list.length ? supabase.storage.from(BUCKET).remove(list) : Promise.resolve()
}
