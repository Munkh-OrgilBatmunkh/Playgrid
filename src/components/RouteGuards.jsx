import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/States'

// Нэвтрээгүй хэрэглэгчийг /login руу чиглүүлнэ
export function RequireAuth({ children }) {
  const { user, loading, profileReady } = useAuth()
  const location = useLocation()
  if (loading || !profileReady) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Зөвхөн админ. UI-ийн хамгаалалт; жинхэнэ хамгаалалт нь өгөгдлийн сангийн RLS (is_admin()).
export function RequireAdmin({ children }) {
  const { user, isAdmin, loading, profileReady } = useAuth()
  const location = useLocation()
  if (loading || !profileReady) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
