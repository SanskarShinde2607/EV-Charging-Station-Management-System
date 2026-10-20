import { useState, useEffect } from 'react'
import api from '../api/client'
import { Car, Plus, Trash2 } from 'lucide-react'

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    make: '', model: '', year: 2024, connector_type: 'CCS',
    battery_capacity_kwh: 40, max_charge_kw: 50, license_plate: '', is_default: false,
  })
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/vehicles/me')
      .then(({ data }) => setVehicles(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/vehicles/', form)
      setShowForm(false)
      setForm({ make: '', model: '', year: 2024, connector_type: 'CCS', battery_capacity_kwh: 40, max_charge_kw: 50, license_plate: '', is_default: false })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add vehicle')
    }
  }

  const remove = async (id) => {
    if (!confirm('Remove this vehicle?')) return
    await api.delete(`/vehicles/${id}`)
    load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">My Vehicles</h1>
        <p className="text-sm text-navy-500 mt-1">Registration number is required for station check-in (e.g. MH14AB1234).</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-charge-500 hover:bg-charge-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add vehicle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.connector_type} onChange={(e) => setForm({ ...form, connector_type: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="CCS">CCS</option>
              <option value="Type2">Type 2</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Tesla">Tesla</option>
            </select>
            <input required placeholder="Registration e.g. MH14AB1234" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-navy-600">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Default vehicle
            </label>
          </div>
          <button type="submit" className="bg-charge-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
        </form>
      )}

      {loading && <p className="text-navy-400">Loading…</p>}
      {!loading && vehicles.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Car className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-navy-500">No vehicles yet</p>
        </div>
      )}

      <div className="space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-navy-900">
                {v.make} {v.model} {v.year && `(${v.year})`}
                {v.is_default && <span className="ml-2 text-xs bg-charge-100 text-charge-700 px-2 py-0.5 rounded-full">Default</span>}
              </h3>
              <p className="text-sm text-navy-500 mt-0.5">
                {v.connector_type}
                {v.license_plate && ` · ${v.license_plate}`}
                {v.battery_capacity_kwh && ` · ${v.battery_capacity_kwh} kWh`}
              </p>
            </div>
            <button onClick={() => remove(v.id)} className="text-red-400 hover:text-red-600 p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
