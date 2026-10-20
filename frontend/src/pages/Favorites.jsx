import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Heart, MapPin } from 'lucide-react'

export default function Favorites() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/favorites/me').then(({ data }) => setList(data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const remove = async (stationId) => {
    await api.delete(`/favorites/${stationId}`)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Favorites</h1>
      {loading && <p className="text-navy-400">Loading…</p>}
      {!loading && list.length === 0 && (
        <p className="text-navy-500">No favorite stations yet. Save stations from the station details page.</p>
      )}
      <div className="space-y-3">
        {list.map((f) => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <Link to={`/stations/${f.station_id}`} className="font-semibold text-navy-900 hover:text-charge-600">{f.name}</Link>
              <p className="text-sm text-navy-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {f.address}{f.city ? `, ${f.city}` : ''}
              </p>
            </div>
            <button onClick={() => remove(f.station_id)} className="text-red-400 hover:text-red-600" title="Remove">
              <Heart className="w-5 h-5 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
