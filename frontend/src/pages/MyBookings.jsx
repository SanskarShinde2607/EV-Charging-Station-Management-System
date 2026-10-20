import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Calendar, MapPin, XCircle, Clock } from 'lucide-react'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [newStart, setNewStart] = useState('')
  const [duration, setDuration] = useState(60)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/bookings/me').then(({ data }) => setBookings(data)).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.post(`/bookings/${id}/cancel`)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Cancel failed')
    }
  }

  const reschedule = async (id) => {
    if (!newStart) { alert('Pick a start time'); return }
    const start = new Date(newStart)
    const end = new Date(start.getTime() + duration * 60000)
    try {
      await api.put(`/bookings/${id}/reschedule`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      setMsg('Rescheduled successfully')
      setRescheduleId(null)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Reschedule failed')
    }
  }

  const statusColor = {
    confirmed: 'bg-charge-100 text-charge-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    arrived: 'bg-blue-100 text-blue-700',
    charging: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">My Bookings</h1>
      {msg && <p className="text-sm text-charge-700 mb-4">{msg}</p>}
      {loading && <p className="text-navy-400">Loading…</p>}
      {!loading && bookings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-navy-500">No bookings yet</p>
          <Link to="/explore" className="inline-block mt-4 text-charge-600 font-medium hover:underline">Find a station →</Link>
        </div>
      )}
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-navy-900">{b.station_name || `Charger #${b.charger_id}`}</h3>
                  {b.booking_code && <span className="text-xs font-mono bg-navy-100 text-navy-700 px-2 py-0.5 rounded">{b.booking_code}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.status] || 'bg-slate-100'}`}>{b.status}</span>
                </div>
                {b.vehicle_reg && <p className="text-sm text-charge-700 mt-1">Vehicle: {b.vehicle_reg}{b.vehicle_label ? ` (${b.vehicle_label})` : ''}</p>}
                <p className="text-sm text-navy-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {b.charger_label && `Charger ${b.charger_label} · `}
                  {new Date(b.start_time).toLocaleString()} – {new Date(b.end_time).toLocaleTimeString()}
                </p>
                {b.estimated_cost != null && <p className="text-sm text-navy-600 mt-1">Est. ₹{b.estimated_cost}</p>}
              </div>
              {b.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button onClick={() => { setRescheduleId(b.id); setNewStart('') }}
                    className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-charge-600 font-medium">
                    <Clock className="w-4 h-4" /> Reschedule
                  </button>
                  <button onClick={() => cancel(b.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
            {rescheduleId === b.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-navy-500 mb-1">New start</label>
                  <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-navy-500 mb-1">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <button onClick={() => reschedule(b.id)} className="bg-charge-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Confirm</button>
                <button onClick={() => setRescheduleId(null)} className="text-sm text-navy-500">Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
