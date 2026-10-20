import { useState, useEffect } from 'react'
import api from '../api/client'
import { UserPlus } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [stations, setStations] = useState([])
  const [bookings, setBookings] = useState([])
  const [report, setReport] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [opForm, setOpForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [opMsg, setOpMsg] = useState(null)
  const [opErr, setOpErr] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, u, st, bk] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/stations').catch(() => ({ data: [] })),
        api.get('/admin/bookings').catch(() => ({ data: [] })),
      ])
      setStats(s.data)
      setUsers(u.data)
      setStations(st.data || [])
      setBookings(bk?.data || [])
      api.get('/reports/admin').then((r) => setReport(r.data)).catch(() => {})
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load admin data (admin role required)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`)
    load()
  }

  const verify = async (id) => {
    await api.patch(`/admin/users/${id}/verify`)
    load()
  }

  const createOperator = async (e) => {
    e.preventDefault()
    setOpMsg(null)
    setOpErr(null)
    try {
      await api.post('/admin/operators', opForm)
      setOpMsg('Operator created successfully')
      setOpForm({ email: '', password: '', full_name: '', phone: '' })
      load()
    } catch (err) {
      setOpErr(err.response?.data?.detail || 'Failed to create operator')
    }
  }

  const assignOperator = async (stationId, operatorId) => {
    if (!operatorId) return
    await api.patch(`/admin/stations/${stationId}/assign`, { operator_id: Number(operatorId) })
    load()
  }

  const operators = users.filter((u) => u.role === 'operator')

  if (loading) return <div className="text-center py-20 text-navy-400">Loading admin dashboard…</div>
  if (error) return <div className="max-w-lg mx-auto mt-20 bg-red-50 text-red-700 border border-red-200 rounded-xl p-6 text-center">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-2">Admin Dashboard</h1>
      <p className="text-navy-500 mb-6">Maharashtra EV Charge — platform control, operators and stations</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['overview', 'users', 'operators', 'stations', 'bookings', 'insights'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-navy-800 text-white' : 'bg-slate-100 text-navy-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'EV Owners', value: stats.total_users },
            { label: 'Operators', value: stats.total_operators },
            { label: 'Stations', value: stats.total_stations },
            { label: 'Chargers', value: stats.total_chargers },
            { label: 'Total Bookings', value: stats.total_bookings },
            { label: 'Active Bookings', value: stats.active_bookings },
            { label: 'Open Faults', value: stats.open_faults },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-2xl font-bold text-navy-900">{c.value}</div>
              <div className="text-sm text-navy-500">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'operators' && (
        <div className="space-y-6">
          <form onSubmit={createOperator} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-navy-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-charge-600" /> Register new operator
            </h3>
            <p className="text-sm text-navy-500">Only admin can create operator accounts. They cannot self-register.</p>
            {opMsg && <p className="text-sm text-charge-700">{opMsg}</p>}
            {opErr && <p className="text-sm text-red-600">{opErr}</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Full name" value={opForm.full_name}
                onChange={(e) => setOpForm({ ...opForm, full_name: e.target.value })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <input required type="email" placeholder="Email" value={opForm.email}
                onChange={(e) => setOpForm({ ...opForm, email: e.target.value })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <input required type="password" minLength={6} placeholder="Password" value={opForm.password}
                onChange={(e) => setOpForm({ ...opForm, password: e.target.value })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone" value={opForm.phone}
                onChange={(e) => setOpForm({ ...opForm, phone: e.target.value })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="bg-charge-500 hover:bg-charge-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Create operator
            </button>
          </form>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left"><tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody>
                {operators.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-navy-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-charge-100 text-charge-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stations' && (
        <div className="space-y-3">
          {stations.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-navy-900">{s.name}</h3>
                <p className="text-sm text-navy-500">{s.address}{s.city ? `, ${s.city}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" defaultValue=""
                  onChange={(e) => assignOperator(s.id, e.target.value)}>
                  <option value="">Assign operator…</option>
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>{o.full_name}</option>
                  ))}
                </select>
                <button
                  onClick={async () => { await api.patch(`/admin/stations/${s.id}/toggle-active`); load() }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${s.is_active ? 'bg-charge-100 text-charge-700' : 'bg-red-100 text-red-700'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'insights' && report && (
        <div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white border rounded-xl p-4"><div className="text-xl font-bold">{report.summary.users}</div><div className="text-xs">Users</div></div>
            <div className="bg-white border rounded-xl p-4"><div className="text-xl font-bold">₹{report.summary.estimated_revenue}</div><div className="text-xs">Revenue</div></div>
            <div className="bg-white border rounded-xl p-4"><div className="text-xl font-bold">{report.summary.open_tickets}</div><div className="text-xs">Open tickets</div></div>
          </div>
          <pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto">{JSON.stringify(report.summary, null, 2)}</pre>
          <ul className="mt-3 text-sm list-disc pl-5 text-navy-600">
            {(report.insights || []).map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 text-sm flex justify-between">
              <div>
                <span className="font-medium">{b.station_name}</span> · {b.charger_label}
                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">{b.status}</span>
                <p className="text-navy-500 mt-1">{b.start_time && new Date(b.start_time).toLocaleString()}</p>
              </div>
              <div className="text-navy-700">₹{b.estimated_cost ?? '—'}</div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-navy-400">No bookings.</p>}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-navy-500">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-charge-100 text-charge-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => toggleActive(u.id)} className="text-xs text-navy-600 font-medium">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {!u.is_verified && (
                      <button onClick={() => verify(u.id)} className="text-xs text-charge-600 font-medium">Verify</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
