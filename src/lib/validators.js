export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
export const validateUsername = (v) => (/^[A-Za-z0-9_]{3,20}$/.test(v.trim()) ? '' : 'Хэрэглэгчийн нэр 3–20 тэмдэгт (латин үсэг, тоо, _)')
export const validatePassword = (v) => (v.length >= 8 ? '' : 'Нууц үг хамгийн багадаа 8 тэмдэгт')
