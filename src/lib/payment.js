// Картын мэдээлэл зөвхөн хөтөч дээр шалгагдана — сервер/өгөгдлийн сан руу ХЭЗЭЭ Ч илгээгдэхгүй.
export const digits = (s = '') => s.replace(/\D/g, '')

export const formatCard = (v) => digits(v).slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

export const formatExpiry = (v) => {
  const d = digits(v).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

// Luhn алгоритм: картын дугаарын шалгах цифр
export function luhn(num) {
  const d = digits(num)
  if (d.length < 13) return false
  let sum = 0, alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function expiryValid(v) {
  const m = v.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const mm = Number(m[1]), yy = 2000 + Number(m[2])
  if (mm < 1 || mm > 12) return false
  return new Date(yy, mm, 1) > new Date() // сарын эцэс хүртэл хүчинтэй
}

export function cardBrand(num) {
  const d = digits(num)
  if (/^4/.test(d)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard'
  return ''
}
