import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { MapPin, Zap, Users, Building2 } from 'lucide-react'

export default function PublicDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/public/dashboard').then((r) => setData(r.data)).catch(console.error)
  }, [])

  if (!data) return <div className="text-center py-20 text-navy-400">Loading network stats…</div>

  const cards = [
    { label: 'Active stations', value: data.stations, icon: Building2 },
    { label: 'Chargers', value: data.chargers, icon: Zap },
    { label: 'Available now', value: data.available_chargers, icon: Zap },
    { label: 'Bookings', value: data.total_bookings, icon: MapPin },
    { label: 'Registered drivers', value: data.registered_drivers, icon: Users },
    { label: 'Operators', value: data.operators, icon: Users },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900">{data.network_name}</h1>
      <p className="text-navy-500 mt-2">{data.tagline}</p>
      <p className="text-sm text-charge-700 mt-1">Coverage: {data.coverage}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <c.icon className="w-5 h-5 text-charge-500 mb-2" />
            <div className="text-2xl font-bold text-navy-900">{c.value}</div>
            <div className="text-sm text-navy-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-navy-900 mb-3">Stations by city</h2>
          {(data.cities || []).map((c) => (
            <div key={c.city} className="flex justify-between text-sm py-2 border-b border-slate-50">
              <span>{c.city}</span>
              <span className="font-medium">{c.stations}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-navy-900 mb-3">Connector mix</h2>
          {Object.entries(data.connector_mix || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-2 border-b border-slate-50">
              <span>{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/explore" className="bg-charge-500 text-white px-5 py-2.5 rounded-lg font-medium">Find stations</Link>
        <Link to="/register" className="border border-slate-200 px-5 py-2.5 rounded-lg font-medium text-navy-700">Register as driver</Link>
      </div>
    </div>
  )
}
