import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MapPin, Calendar, Car, Zap, Bell, Settings, Shield, MessageSquare, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role

  const cards = [
    { to: '/explore', icon: MapPin, title: 'Find chargers', desc: 'Map search and smart suggestions', show: true },
    { to: '/bookings', icon: Calendar, title: 'My bookings', desc: 'Reservations, cancel & reschedule', show: true },
    { to: '/vehicles', icon: Car, title: 'My vehicles', desc: 'Registration & connectors', show: role === 'ev_owner' || role === 'admin' },
    { to: '/favorites', icon: Zap, title: 'Saved stations', desc: 'Quick access to favourites', show: true },
    { to: '/notifications', icon: Bell, title: 'Notifications', desc: 'Booking and service alerts', show: true },
    { to: '/support', icon: MessageSquare, title: 'Help & queries', desc: 'Talk to support', show: true },
    { to: '/profile', icon: Settings, title: 'Account', desc: 'Profile and preferences', show: true },
    { to: '/network', icon: BarChart3, title: 'Network overview', desc: 'Public live statistics', show: true },
    { to: '/operator', icon: Settings, title: 'Station partner', desc: 'Sites, check-in & sessions', show: role === 'operator' || role === 'admin' },
    { to: '/admin', icon: Shield, title: 'Network admin', desc: 'Users, partners & reports', show: role === 'admin' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-2xl overflow-hidden mb-8 relative h-36">
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-900/70 flex flex-col justify-center px-6">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-navy-200 text-sm mt-1 capitalize">
            {user?.role?.replace('_', ' ')} account · EV Charge Maharashtra
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.filter((c) => c.show).map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-charge-300 hover:shadow-md transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-charge-100 text-charge-600 flex items-center justify-center mb-4 group-hover:bg-charge-500 group-hover:text-white transition">
              <c.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-navy-900">{c.title}</h3>
            <p className="text-sm text-navy-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
