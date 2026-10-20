import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../api/client'
import { MapPin, Zap, Clock, IndianRupee, Filter, Search, Navigation } from 'lucide-react'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1 })
  }, [center, map])
  return null
}

const DEFAULT_CENTER = [18.5204, 73.8567] // Pune, Maharashtra

export default function Explore() {
  const [stations, setStations] = useState([])
  const [ranked, setRanked] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLoc, setUserLoc] = useState(DEFAULT_CENTER)
  const [connector, setConnector] = useState('')
  const [minPower, setMinPower] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [useRanking, setUseRanking] = useState(true)
  const [error, setError] = useState(null)

  const fetchStations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (useRanking) {
        const { data } = await api.post('/recommendations/', {
          latitude: userLoc[0],
          longitude: userLoc[1],
          connector_type: connector || null,
          max_distance_km: 30,
          min_power_kw: minPower ? Number(minPower) : null,
          max_price: maxPrice ? Number(maxPrice) : null,
          available_only: availableOnly,
        })
        if (!data || data.length === 0) {
          const plain = await api.get('/stations/', {
            params: { lat: userLoc[0], lon: userLoc[1], max_distance: 30, connector: connector || undefined },
          })
          setStations(plain.data || [])
          setRanked([])
        } else {
          setRanked(data)
          setStations([])
        }
      } else {
        const params = { lat: userLoc[0], lon: userLoc[1], max_distance: 30 }
        if (connector) params.connector = connector
        const { data } = await api.get('/stations/', { params })
        setStations(data)
        setRanked([])
      }
    } catch (e) {
      setError('Could not load stations. Is the backend running on port 8000?')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userLoc, connector, useRanking, minPower, maxPrice, availableOnly])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  const locateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => alert('Could not get your location')
    )
  }

  const list = useRanking ? (ranked.length ? ranked : stations) : stations

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Find Your Next Charge</h1>
        <p className="text-navy-500 mt-1">Discover and rank nearby EV charging stations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <button
          onClick={locateMe}
          className="inline-flex items-center gap-2 px-3 py-2 bg-navy-50 hover:bg-navy-100 text-navy-700 rounded-lg text-sm font-medium transition"
        >
          <Navigation className="w-4 h-4" />
          Use my location
        </button>

        <select
          value={connector}
          onChange={(e) => setConnector(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charge-400"
        >
          <option value="">All connectors</option>
          <option value="CCS">CCS</option>
          <option value="Type2">Type 2</option>
          <option value="CHAdeMO">CHAdeMO</option>
        </select>

        <select value={minPower} onChange={(e) => setMinPower(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Min power</option>
          <option value="22">22+ kW</option>
          <option value="50">50+ kW</option>
          <option value="60">60+ kW</option>
          <option value="120">120+ kW</option>
        </select>

        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Max price</option>
          <option value="12">≤ ₹12/kWh</option>
          <option value="14">≤ ₹14/kWh</option>
          <option value="16">≤ ₹16/kWh</option>
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-navy-600 cursor-pointer">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)}
            className="rounded border-slate-300 text-charge-500" />
          Available only
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-navy-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useRanking}
            onChange={(e) => setUseRanking(e.target.checked)}
            className="rounded border-slate-300 text-charge-500 focus:ring-charge-400"
          />
          Best match for you
        </label>

        <button
          onClick={fetchStations}
          className="ml-auto inline-flex items-center gap-2 bg-charge-500 hover:bg-charge-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Station list */}
        <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading && (
            <div className="text-center py-12 text-navy-400">Loading stations…</div>
          )}
          {!loading && list.length === 0 && (
            <div className="text-center py-12 text-navy-400">No stations found nearby.</div>
          )}
          {list.map((s) => {
            const id = s.station_id || s.id
            const name = s.name
            const dist = s.distance_km
            const avail = s.available_chargers
            const score = s.score
            return (
              <Link
                key={id}
                to={`/stations/${id}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-charge-300 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-navy-900">{name}</h3>
                  {score !== undefined && (
                    <span className="text-xs bg-charge-100 text-charge-700 px-2 py-0.5 rounded-full font-medium">
                      Score {score.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy-400 mt-0.5 truncate">{s.address}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-navy-500">
                  {dist != null && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-charge-500" />
                      {dist} km
                    </span>
                  )}
                  {s.travel_time_min != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{Math.round(s.travel_time_min)} min
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-charge-500" />
                    {avail ?? '—'} available
                  </span>
                  {s.cost_per_kwh != null && (
                    <span className="inline-flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      ₹{s.cost_per_kwh}/kWh
                    </span>
                  )}
                </div>
                {s.connector_types && (
                  <div className="flex gap-1.5 mt-2">
                    {s.connector_types.map((c) => (
                      <span key={c} className="text-xs bg-slate-100 text-navy-600 px-2 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {s.explanation && (
                  <p className="text-xs text-charge-700 mt-2 leading-snug">{s.explanation}</p>
                )}
              </Link>
            )
          })}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 h-[70vh] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <MapContainer center={userLoc} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo center={userLoc} />
            <Marker position={userLoc}>
              <Popup>Your location</Popup>
            </Marker>
            {list.map((s) => {
              const id = s.station_id || s.id
              const lat = s.latitude
              const lon = s.longitude
              if (!lat || !lon) return null
              return (
                <Marker key={id} position={[lat, lon]} icon={greenIcon}>
                  <Popup>
                    <strong>{s.name}</strong>
                    <br />
                    {s.distance_km != null && `${s.distance_km} km · `}
                    {s.available_chargers ?? '—'} available
                    <br />
                    <Link to={`/stations/${id}`} className="text-charge-600 font-medium">
                      View details →
                    </Link>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
