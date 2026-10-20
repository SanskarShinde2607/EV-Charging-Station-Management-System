import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    address: '', city: 'Pune', state: 'Maharashtra', pincode: '',
    preferred_connector: 'CCS',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ ...form, role: 'ev_owner' })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">Create EV Driver Account</h1>
      <p className="text-sm text-navy-500 mt-1">
        Public registration is for drivers only. Station operators are onboarded by the platform admin with company details.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        {error && <p className="text-sm text-red-600">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm text-navy-600 mb-1">Full name *</label>
            <input required value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-navy-600 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">Password *</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">Phone *</label>
            <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-navy-600 mb-1">Address</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">City</label>
            <select value={form.city} onChange={(e) => set('city', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Other'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">State</label>
            <input value={form.state} onChange={(e) => set('state', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">PIN code</label>
            <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-600 mb-1">Preferred connector</label>
            <select value={form.preferred_connector} onChange={(e) => set('preferred_connector', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="CCS">CCS</option>
              <option value="Type2">Type 2</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-charge-500 hover:bg-charge-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-60">
          {loading ? 'Creating…' : 'Register as EV Driver'}
        </button>
        <p className="text-center text-sm text-navy-500">
          Already have an account? <Link to="/login" className="text-charge-600 font-medium">Log in</Link>
        </p>
      </form>
    </div>
  )
}
