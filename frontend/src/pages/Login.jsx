import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user?.role === 'admin') navigate('/admin')
      else if (user?.role === 'operator') navigate('/operator')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-900/70 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold">Charge with confidence</h2>
          <p className="mt-2 text-navy-200 max-w-sm">Access stations across Maharashtra with one account for drivers, partners and network admin.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-charge-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-navy-900">Welcome back</span>
          </div>
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-charge-400 focus:border-charge-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-charge-400 focus:border-charge-400 outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-charge-500 hover:bg-charge-600 text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 transition">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-center text-sm text-navy-500">
              New driver? <Link to="/register" className="text-charge-600 font-medium">Create an account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
