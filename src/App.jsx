import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import PaymentBadges from './components/PaymentBadges'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import Home from './pages/Home'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminGames from './pages/admin/Games'
import GameForm from './pages/admin/GameForm'
import AdminOrders from './pages/admin/Orders'
import AdminUsers from './pages/admin/Users'

// Хуудас солигдоход дээш, #hash байвал тухайн хэсэг рүү зөөлөн гүйлгэнэ
function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }
    // getElementById нь Supabase-ийн #access_token=... зэрэг hash дээр алдаа гаргахгүй
    const t = setTimeout(
      () =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    )
    return () => clearTimeout(t)
  }, [pathname, hash, key])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login mode="login" />} />
        <Route path="/register" element={<Login mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="games/new" element={<GameForm />} />
          <Route path="games/:id" element={<GameForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2026 PLAYGRID. Бүх эрх хуулиар хамгаалагдсан.</span>
          <PaymentBadges />
        </div>
      </footer>
    </>
  )
}
