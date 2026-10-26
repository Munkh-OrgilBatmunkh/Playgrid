import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <footer className="footer">
        <div className="container">
          © 2026 PLAYGRID. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </footer>
    </>
  )
}
