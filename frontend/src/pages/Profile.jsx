import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Profile() {
  const { user, login } = useAuth()
  const [full_name, setName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const save = async (e) => {
    e.preventDefault()
    setMsg(null); setErr(null)
    try {
      const { data } = await api.put('/auth/me', { full_name, phone })
      localStorage.setItem('user', JSON.stringify(data))
      setMsg('Profile updated')
      window.location.reload()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Update failed')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Profile & Settings</h1>
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        {msg && <p className="text-sm text-charge-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div>
          <label className="block text-sm text-navy-600 mb-1">Email</label>
          <input disabled value={user?.email || ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" />
        </div>
        <div>
          <label className="block text-sm text-navy-600 mb-1">Full name</label>
          <input value={full_name} onChange={(e) => setName(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-navy-600 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-navy-600 mb-1">Role</label>
          <input disabled value={user?.role?.replace('_', ' ') || ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 capitalize" />
        </div>
        <button type="submit" className="bg-charge-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Save changes</button>
      </form>
    </div>
  )
}
