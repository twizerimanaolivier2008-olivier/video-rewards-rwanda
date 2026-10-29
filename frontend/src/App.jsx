import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ToastProvider from './components/Toast'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import Videos from './pages/Videos'
import VideoPlayer from './pages/VideoPlayer'
import Dashboard from './pages/Dashboard'
import Referrals from './pages/Referrals'
import Withdrawals from './pages/Withdrawals'
import AdminDashboard from './pages/AdminDashboard'
import AdminVideos from './pages/AdminVideos'
import AdminWithdrawals from './pages/AdminWithdrawals'
import AdminUsers from './pages/AdminUsers'
import AdminCompanies from './pages/AdminCompanies'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <ToastProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/referrals"
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdrawals"
              element={
                <ProtectedRoute>
                  <Withdrawals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <AdminRoute>
                  <AdminVideos />
                </AdminRoute>
              }
            />
<Route
              path="/admin/withdrawals"
              element={
                <AdminRoute>
                  <AdminWithdrawals />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <AdminRoute>
                  <AdminCompanies />
                </AdminRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}

export default App
