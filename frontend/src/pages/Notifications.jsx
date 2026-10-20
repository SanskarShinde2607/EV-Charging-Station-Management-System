import { useState, useEffect } from 'react'
import api from '../api/client'
import { Bell, Check } from 'lucide-react'

export default function Notifications() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/notifications/me')
      .then(({ data }) => setNotes(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`)
    load()
  }

  const markAll = async () => {
    await api.post('/notifications/read-all')
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
        {notes.some((n) => !n.is_read) && (
          <button onClick={markAll} className="text-sm text-charge-600 font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="text-navy-400">Loading…</p>}
      {!loading && notes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-navy-500">No notifications</p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`bg-white border rounded-xl p-4 ${n.is_read ? 'border-slate-100 opacity-70' : 'border-charge-200 bg-charge-50/30'}`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="font-semibold text-navy-900 text-sm">{n.title}</h3>
                <p className="text-sm text-navy-600 mt-1">{n.message}</p>
                {n.created_at && (
                  <p className="text-xs text-navy-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                )}
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="text-charge-600 p-1" title="Mark read">
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
