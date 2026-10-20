import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MessageSquare } from 'lucide-react'

export default function Support() {
  const { isAuthenticated, user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ subject: '', description: '', category: 'booking', priority: 'medium' })
  const [msg, setMsg] = useState(null)
  const [reply, setReply] = useState({})

  const load = () => {
    if (!isAuthenticated) return
    const url = user?.role === 'admin' || user?.role === 'operator' ? '/support/tickets' : '/support/tickets/me'
    api.get(url).then((r) => setTickets(r.data)).catch(console.error)
  }
  useEffect(() => { load() }, [isAuthenticated, user])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/support/tickets', form)
      setMsg('Query submitted')
      setForm({ subject: '', description: '', category: 'booking', priority: 'medium' })
      load()
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Failed')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-navy-600">Please log in to submit or view support queries.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-charge-500" /> Support & Queries
      </h1>
      <p className="text-sm text-navy-500 mt-1">Ask about bookings, stations, or account issues.</p>

      {user?.role === 'ev_owner' && (
        <form onSubmit={submit} className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {msg && <p className="text-sm text-charge-700">{msg}</p>}
          <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="booking">Booking</option>
            <option value="station">Station / charger</option>
            <option value="vehicle">Vehicle</option>
            <option value="payment">Payment</option>
            <option value="other">Other</option>
          </select>
          <textarea required rows={4} placeholder="Describe your issue…" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="bg-charge-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit query</button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        <h2 className="font-semibold text-navy-900">Your tickets</h2>
        {tickets.length === 0 && <p className="text-sm text-navy-400">No queries yet.</p>}
        {tickets.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-navy-900">{t.subject}</span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{t.status}</span>
            </div>
            <p className="text-navy-500 mt-1">{t.category} · {t.user_name}</p>
            <p className="text-navy-600 mt-2">{t.description}</p>
            {t.response && <p className="mt-2 text-charge-700 bg-charge-50 rounded-lg p-2">Reply: {t.response}</p>}
            {(user?.role === 'admin' || user?.role === 'operator') && t.status === 'open' && (
              <div className="mt-3 flex gap-2">
                <input placeholder="Reply…" value={reply[t.id] || ''} onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                <button onClick={async () => {
                  await api.post(`/support/tickets/${t.id}/reply`, { response: reply[t.id], status: 'resolved' })
                  load()
                }} className="bg-navy-800 text-white px-3 py-1.5 rounded text-xs">Resolve</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
