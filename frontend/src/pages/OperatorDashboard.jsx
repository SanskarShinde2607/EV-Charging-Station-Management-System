import { useState, useEffect } from 'react'
import api from '../api/client'
import { MapPin, Zap, Calendar, AlertTriangle, RefreshCw } from 'lucide-react'

export default function OperatorDashboard() {
  const [stations, setStations] = useState([])
  const [bookings, setBookings] = useState([])
  const [faults, setFaults] = useState([])
  const [chargers, setChargers] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [tab, setTab] = useState('bookings')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [plate, setPlate] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [checkErr, setCheckErr] = useState(null)
  const [report, setReport] = useState(null)
  const [bookingsError, setBookingsError] = useState(null)
  const [stationsError, setStationsError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    setBookingsError(null)
    setStationsError(null)
    try {
      const sRes = await api.get('/operator/stations').catch((e) => {
        setStationsError(e.response?.data?.detail || e.message)
        return { data: [] }
      })
      setStations(sRes.data || [])

      const bRes = await api.get('/operator/bookings').catch((e) => {
        setBookingsError(e.response?.data?.detail || e.message || 'Failed to load bookings')
        return { data: [] }
      })
      setBookings(Array.isArray(bRes.data) ? bRes.data : [])

      const fRes = await api.get('/operator/faults').catch(() => ({ data: [] }))
      setFaults(fRes.data || [])

      const aRes = await api.get('/operator/analytics').catch(() => ({ data: null }))
      setAnalytics(aRes.data)

      api.get('/reports/operator').then((r) => setReport(r.data)).catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadChargers = async (stationId) => {
    setSelectedStation(stationId)
    const { data } = await api.get(`/operator/stations/${stationId}/chargers`)
    setChargers(data)
    setTab('chargers')
  }

  const toggleCharger = async (chargerId, field, value) => {
    await api.patch(`/operator/chargers/${chargerId}`, { [field]: value })
    if (selectedStation) loadChargers(selectedStation)
    else load()
  }

  const startSession = async (bookingId) => {
    try {
      await api.post(`/operator/sessions/${bookingId}/start`)
      setActionMsg(`Charging started for booking #${bookingId}`)
      load()
    } catch (e) {
      setActionMsg(e.response?.data?.detail || 'Could not start session')
    }
  }

  const completeSession = async (bookingId) => {
    try {
      const kwh = prompt('Energy delivered (kWh)?', '15')
      await api.post(`/operator/sessions/${bookingId}/complete?energy_kwh=${kwh || 0}`)
      setActionMsg(`Session completed for booking #${bookingId}`)
      load()
    } catch (e) {
      setActionMsg(e.response?.data?.detail || 'Could not complete session')
    }
  }

  const statusStyle = {
    confirmed: 'bg-charge-100 text-charge-800',
    arrived: 'bg-blue-100 text-blue-800',
    charging: 'bg-purple-100 text-purple-800',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-navy-900">Station partner panel</h1>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <p className="text-navy-500 mb-6">Manage stations, reservations, check-in and sessions</p>

      {/* Check-in */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-navy-900 mb-2">Vehicle arrival check-in</h2>
        <p className="text-xs text-navy-500 mb-3">
          Enter registration number (e.g. MH14AB1234) to match a booking on your stations.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="MH14AB1234"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            onClick={async () => {
              setCheckErr(null)
              setCheckResult(null)
              try {
                const { data } = await api.post(`/operator/check-in?registration=${encodeURIComponent(plate)}`)
                setCheckResult(data)
                load()
              } catch (e) {
                setCheckErr(e.response?.data?.detail || 'Check-in failed')
              }
            }}
            className="bg-charge-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Verify vehicle
          </button>
        </div>
        {checkErr && <p className="text-sm text-red-600 mt-2">{checkErr}</p>}
        {checkResult && (
          <div className="mt-3 text-sm bg-charge-50 border border-charge-100 rounded-lg p-3">
            <p className="font-medium text-navy-900">{checkResult.message}</p>
            <p className="text-navy-600 mt-1">
              {checkResult.booking_code} · {checkResult.vehicle_reg} · {checkResult.vehicle}
            </p>
            <p className="text-navy-500">
              {checkResult.station} · {checkResult.charger}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => startSession(checkResult.booking_id)}
                className="bg-navy-800 text-white px-3 py-1.5 rounded text-xs"
              >
                Start charging
              </button>
              <button
                type="button"
                onClick={() => completeSession(checkResult.booking_id)}
                className="bg-charge-600 text-white px-3 py-1.5 rounded text-xs"
              >
                Complete charging
              </button>
            </div>
          </div>
        )}
      </div>

      {actionMsg && (
        <p className="text-sm text-charge-700 mb-4 bg-charge-50 border border-charge-100 rounded-lg px-3 py-2">
          {actionMsg}
        </p>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['bookings', 'stations', 'chargers', 'faults', 'analytics', 'insights'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-navy-600'
            }`}
          >
            {t}
            {t === 'bookings' && bookings.length > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({bookings.length})</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-navy-400">Loading…</p>}

      {/* BOOKINGS — default tab */}
      {tab === 'bookings' && !loading && (
        <div className="space-y-3">
          {stationsError && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              Stations: {stationsError}
            </p>
          )}
          {bookingsError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Bookings error: {bookingsError}
            </p>
          )}
          {!bookingsError && bookings.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Calendar className="w-10 h-10 text-navy-300 mx-auto mb-3" />
              <p className="text-navy-700 font-medium">No bookings on your stations yet</p>
              <p className="text-sm text-navy-500 mt-2 max-w-md mx-auto">
                Bookings appear here when a driver reserves a connector at a station assigned to you.
                Log in as a driver, book at one of your stations, then refresh this page.
              </p>
              {stations.length === 0 && (
                <p className="text-sm text-amber-700 mt-3">
                  You have no assigned stations. Ask network admin to assign stations to your operator account.
                </p>
              )}
              {stations.length > 0 && (
                <p className="text-xs text-navy-400 mt-3">
                  Your stations: {stations.map((s) => s.name).join(', ')}
                </p>
              )}
            </div>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-navy-900">
                      {b.station_name || 'Station'} · {b.charger_label || `Charger #${b.charger_id}`}
                    </h3>
                    {b.booking_code && (
                      <span className="text-xs font-mono bg-navy-100 text-navy-700 px-2 py-0.5 rounded">
                        {b.booking_code}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyle[b.status] || 'bg-slate-100'}`}>
                      {b.status}
                    </span>
                  </div>
                  {b.vehicle_reg && (
                    <p className="text-sm text-charge-700 mt-1 font-medium">
                      Vehicle: {b.vehicle_reg}
                      {b.vehicle_label ? ` (${b.vehicle_label})` : ''}
                    </p>
                  )}
                  <p className="text-sm text-navy-500 mt-1">
                    {b.start_time && new Date(b.start_time).toLocaleString()}
                    {b.end_time && ` – ${new Date(b.end_time).toLocaleTimeString()}`}
                    {b.estimated_cost != null && ` · ₹${b.estimated_cost}`}
                    {b.connector_type && ` · ${b.connector_type}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(b.status === 'confirmed' || b.status === 'arrived') && (
                    <button
                      type="button"
                      onClick={() => startSession(b.id)}
                      className="text-xs bg-navy-800 text-white px-3 py-1.5 rounded-lg"
                    >
                      Start charging
                    </button>
                  )}
                  {(b.status === 'charging' || b.status === 'arrived') && (
                    <button
                      type="button"
                      onClick={() => completeSession(b.id)}
                      className="text-xs bg-charge-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stations' && !loading && (
        <div className="space-y-3">
          {stations.length === 0 && (
            <p className="text-navy-500">No stations assigned. Contact network admin.</p>
          )}
          {stations.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-navy-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-charge-500" /> {s.name}
                </h3>
                <p className="text-sm text-navy-500">{s.address}{s.city ? `, ${s.city}` : ''}</p>
                <p className="text-xs text-navy-400 mt-1">
                  {s.available_count ?? s.available ?? '—'} available / {s.charger_count ?? '—'} chargers · {s.operating_hours}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadChargers(s.id)}
                className="text-sm text-charge-600 font-medium hover:underline"
              >
                Manage chargers
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'chargers' && (
        <div className="space-y-3">
          {!selectedStation && <p className="text-navy-400">Select a station first.</p>}
          {chargers.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between gap-2">
              <div>
                <span className="font-medium">{c.label}</span>
                <span className="text-navy-500 text-sm ml-2">
                  {c.connector_type} · {c.power_kw} kW · ₹{c.price_per_kwh}/kWh
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleCharger(c.id, 'is_available', !c.is_available)}
                  className={`text-xs px-3 py-1 rounded-lg ${c.is_available ? 'bg-charge-100 text-charge-700' : 'bg-slate-100'}`}
                >
                  {c.is_available ? 'Available' : 'Unavailable'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCharger(c.id, 'is_faulty', !c.is_faulty)}
                  className={`text-xs px-3 py-1 rounded-lg ${c.is_faulty ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}
                >
                  {c.is_faulty ? 'Faulty' : 'Mark fault'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faults' && (
        <div className="space-y-3">
          {faults.length === 0 && <p className="text-navy-400">No fault reports.</p>}
          {faults.map((f) => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{f.station_name} · {f.charger_label}</span>
                <span className="text-xs bg-slate-100 px-2 rounded-full">{f.status}</span>
              </div>
              <p className="text-navy-600 mt-1">{f.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-navy-900">{analytics.total_bookings}</div>
              <div className="text-sm text-navy-500">Total bookings</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-navy-900">{analytics.confirmed_bookings}</div>
              <div className="text-sm text-navy-500">Confirmed</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-charge-600">₹{analytics.estimated_revenue}</div>
              <div className="text-sm text-navy-500">Est. revenue</div>
            </div>
          </div>
          <div className="space-y-2">
            {(analytics.by_station || []).map((s) => (
              <div key={s.station_id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between">
                <div>
                  <h3 className="font-medium text-navy-900">{s.name}</h3>
                  <p className="text-sm text-navy-500">
                    {s.chargers} chargers · {s.available} available · {s.bookings} bookings
                  </p>
                </div>
                <div className="font-semibold text-charge-700">₹{s.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'insights' && report && (
        <div>
          <div className="grid sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xl font-bold">{report.summary.stations}</div>
              <div className="text-xs text-navy-500">Stations</div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xl font-bold">{report.summary.bookings}</div>
              <div className="text-xs text-navy-500">Bookings</div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xl font-bold text-charge-600">₹{report.summary.estimated_revenue}</div>
              <div className="text-xs text-navy-500">Est. revenue</div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xl font-bold">{report.summary.chargers}</div>
              <div className="text-xs text-navy-500">Chargers</div>
            </div>
          </div>
          <h3 className="font-medium mb-2">By station</h3>
          {(report.by_station || []).map((s) => (
            <div key={s.station} className="bg-white border rounded-xl p-3 mb-2 flex justify-between text-sm">
              <div>
                <strong>{s.station}</strong> · {s.city}
                <br />
                <span className="text-navy-500">
                  {s.bookings} bookings · {s.utilization_pct}% util.
                </span>
              </div>
              <div className="font-semibold text-charge-700">₹{s.revenue}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
