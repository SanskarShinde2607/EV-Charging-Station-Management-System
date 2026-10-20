import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import StationDetails from './pages/StationDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyBookings from './pages/MyBookings'
import MyVehicles from './pages/MyVehicles'
import Notifications from './pages/Notifications'
import OperatorDashboard from './pages/OperatorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import HowItWorks from './pages/HowItWorks'
import About from './pages/About'
import Contact from './pages/Contact'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import PublicDashboard from './pages/PublicDashboard'
import Support from './pages/Support'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/stations/:id" element={<StationDetails />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/network" element={<PublicDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><MyVehicles /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
        <Route path="/operator" element={<PrivateRoute roles={['operator', 'admin']}><OperatorDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}
