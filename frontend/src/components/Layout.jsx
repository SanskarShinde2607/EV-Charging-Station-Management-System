import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, User, LogOut, Menu, X, Bell } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navCls = (path) =>
    `font-medium transition ${
      location.pathname === path ? 'text-charge-600' : 'text-navy-600 hover:text-charge-600'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-charge-400 to-charge-600 flex items-center justify-center shadow-md shadow-charge-500/20 group-hover:scale-105 transition">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-lg text-navy-900 tracking-tight">
                  EV<span className="text-charge-600">Charge</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-wider text-navy-400">Maharashtra</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/explore" className={navCls('/explore')}>Find Stations</Link>
              <Link to="/network" className={navCls('/network')}>Network</Link>
              <Link to="/how-it-works" className={navCls('/how-it-works')}>How it works</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={navCls('/dashboard')}>Dashboard</Link>
                  <Link to="/bookings" className={navCls('/bookings')}>Bookings</Link>
                  {(user?.role === 'operator' || user?.role === 'admin') && (
                    <Link to="/operator" className={navCls('/operator')}>Partner</Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link to="/admin" className={navCls('/admin')}>Admin</Link>
                  )}
                  <Link to="/support" className={navCls('/support')}>Help</Link>
                  <Link to="/notifications" className="text-navy-400 hover:text-charge-600" title="Notifications">
                    <Bell className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <Link to="/profile" className="text-sm text-navy-600 flex items-center gap-1.5 hover:text-charge-600">
                      <User className="w-4 h-4" />
                      {user?.full_name?.split(' ')[0]}
                    </Link>
                    <button onClick={handleLogout} className="text-navy-400 hover:text-red-500" title="Logout">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-navy-600 hover:text-charge-600 font-medium">Log in</Link>
                  <Link to="/register" className="bg-charge-500 hover:bg-charge-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm shadow-charge-500/25 transition">
                    Sign up
                  </Link>
                </div>
              )}
            </nav>

            <button type="button" className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(!open)}>
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {[
              ['/explore', 'Find Stations'],
              ['/network', 'Network'],
              ['/how-it-works', 'How it works'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="block py-2.5 text-navy-700 font-medium" onClick={() => setOpen(false)}>{label}</Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block py-2.5" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/bookings" className="block py-2.5" onClick={() => setOpen(false)}>Bookings</Link>
                <Link to="/vehicles" className="block py-2.5" onClick={() => setOpen(false)}>Vehicles</Link>
                <Link to="/support" className="block py-2.5" onClick={() => setOpen(false)}>Help</Link>
                <Link to="/profile" className="block py-2.5" onClick={() => setOpen(false)}>Profile</Link>
                {(user?.role === 'operator' || user?.role === 'admin') && (
                  <Link to="/operator" className="block py-2.5" onClick={() => setOpen(false)}>Partner panel</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="block py-2.5" onClick={() => setOpen(false)}>Admin</Link>
                )}
                <button type="button" onClick={() => { handleLogout(); setOpen(false) }} className="block py-2.5 text-red-500 font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2.5" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" className="block py-2.5 text-charge-600 font-semibold" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-950 text-navy-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Zap className="w-5 h-5 text-charge-400" /> EV Charge
            </div>
            <p className="text-sm mt-3 text-navy-400 leading-relaxed">
              Book EV charging across Maharashtra — Pune, Mumbai, Nashik and Nagpur.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Drivers</h4>
            <div className="space-y-2 text-sm">
              <Link to="/explore" className="block hover:text-charge-400">Find stations</Link>
              <Link to="/register" className="block hover:text-charge-400">Create account</Link>
              <Link to="/how-it-works" className="block hover:text-charge-400">How it works</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Network</h4>
            <div className="space-y-2 text-sm">
              <Link to="/network" className="block hover:text-charge-400">Live statistics</Link>
              <Link to="/about" className="block hover:text-charge-400">About us</Link>
              <Link to="/contact" className="block hover:text-charge-400">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <p className="text-sm text-navy-400">support@evcharge.in</p>
            <p className="text-sm text-navy-400 mt-1">+91 20 4850 2200</p>
            <p className="text-xs text-navy-500 mt-4">Station partners are onboarded by network admin.</p>
          </div>
        </div>
        <div className="border-t border-navy-800 py-4 text-center text-xs text-navy-500">
          © 2026 EV Charge India · All rights reserved
        </div>
      </footer>
    </div>
  )
}
