import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MapPin, ArrowLeft, CheckCircle, Heart, Star, Phone, Clock, Car } from 'lucide-react'

export default function StationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [currentSoc, setCurrentSoc] = useState(20)
  const [targetSoc, setTargetSoc] = useState(80)
  const [duration, setDuration] = useState(60)
  const [estimate, setEstimate] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotMsg, setSlotMsg] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingMsg, setBookingMsg] = useState(null)
  const [bookingErr, setBookingErr] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [fav, setFav] = useState(false)

  useEffect(() => {
    api.get(`/stations/${id}`)
      .then(({ data }) => {
        setStation(data)
        api.get(`/reviews/station/${id}`).then((r) => setReviews(r.data)).catch(() => {})
        if (isAuthenticated) {
          api.get('/favorites/me').then((r) => setFav(r.data.some((f) => f.station_id === Number(id)))).catch(() => {})
          api.get('/vehicles/me').then((r) => {
            setVehicles(r.data)
            const def = r.data.find((v) => v.is_default) || r.data[0]
            if (def) setVehicleId(String(def.id))
          }).catch(() => {})
        }
      })
      .catch(() => setStation(null))
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(vehicleId))

  const loadEstimateAndSlots = async () => {
    if (!vehicleId || !isAuthenticated) return
    setSlotMsg(null)
    setSlots([])
    setSelectedSlot(null)
    // pick first compatible charger for estimate
    const compat = (station?.chargers || []).filter(
      (c) => !c.is_faulty && selectedVehicle && c.connector_type.toLowerCase() === selectedVehicle.connector_type.toLowerCase()
    )
    if (!compat.length) {
      setSlotMsg('No compatible connectors for this vehicle')
      return
    }
    try {
      const { data: est } = await api.post('/bookings/estimate-duration', {
        vehicle_id: Number(vehicleId),
        charger_id: compat[0].id,
        current_soc: Number(currentSoc),
        target_soc: Number(targetSoc),
      })
      setEstimate(est)
      setDuration(est.duration_min)
      const { data: slotRes } = await api.post('/bookings/available-slots', {
        station_id: Number(id),
        vehicle_id: Number(vehicleId),
        duration_min: est.duration_min,
      })
      setSlots(slotRes.slots || [])
      setSlotMsg(slotRes.message || null)
    } catch (e) {
      setSlotMsg(e.response?.data?.detail || 'Could not load slots')
    }
  }

  useEffect(() => {
    if (vehicleId && station && isAuthenticated) loadEstimateAndSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, currentSoc, targetSoc, station])

  const handleBook = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!vehicleId) { setBookingErr('Select a vehicle'); return }
    if (!selectedVehicle?.license_plate) { setBookingErr('Vehicle needs a registration number'); return }
    if (!selectedSlot) { setBookingErr('Select an available time slot'); return }
    setSubmitting(true)
    setBookingErr(null)
    setBookingMsg(null)
    try {
      const { data } = await api.post('/bookings/', {
        charger_id: selectedSlot.charger_id,
        vehicle_id: Number(vehicleId),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      })
      setBookingMsg(
        `Confirmed ${data.booking_code} · Vehicle ${data.vehicle_reg} · ${data.station_name} connector ${data.charger_label}`
      )
      loadEstimateAndSlots()
    } catch (e) {
      setBookingErr(e.response?.data?.detail || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-navy-400">Loading…</div>
  if (!station) return <div className="text-center py-20 text-navy-400">Station not found</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-charge-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to explore
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{station.name}</h1>
              <p className="mt-2 text-navy-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {station.address}{station.city && `, ${station.city}`}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              station.status === 'open' ? 'bg-charge-500/30 text-charge-200' : 'bg-red-500/30 text-red-200'
            }`}>
              {(station.status || 'open').replace('_', ' ')}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-navy-200">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {station.operating_hours || '06:00–23:00'}</span>
            {station.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {station.phone}</span>}
            {station.support_phone && <span>Support: {station.support_phone}</span>}
          </div>
          {station.support_email && <p className="text-xs text-navy-400 mt-1">{station.support_email}</p>}
          {station.facilities && <p className="text-sm text-navy-300 mt-2">Facilities: {station.facilities}</p>}
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {station.description && <p className="text-navy-600">{station.description}</p>}

          <div>
            <h2 className="font-semibold text-navy-900 mb-3">Connectors</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {station.chargers?.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-3 text-sm flex justify-between">
                  <div>
                    <span className="font-medium">{c.label}</span>
                    <span className="text-navy-500 ml-2">{c.connector_type} · {c.power_kw} kW</span>
                  </div>
                  <div className="text-right">
                    <div>₹{c.price_per_kwh}/kWh</div>
                    <div className={c.is_faulty ? 'text-red-500' : c.is_available ? 'text-charge-600' : 'text-amber-600'}>
                      {c.is_faulty ? 'Faulty' : c.status || (c.is_available ? 'Available' : 'Busy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligent booking */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="font-semibold text-navy-900 mb-1">Book a charging slot</h3>
            <p className="text-xs text-navy-500 mb-4">Select your vehicle (registration required). We estimate duration and show free connector slots.</p>

            {!isAuthenticated && (
              <p className="text-sm text-navy-600">Please <Link to="/login" className="text-charge-600 font-medium">log in</Link> and add a vehicle first.</p>
            )}

            {isAuthenticated && vehicles.length === 0 && (
              <p className="text-sm text-amber-700">No vehicles yet. <Link to="/vehicles" className="underline">Add a vehicle with registration number</Link> (e.g. MH14AB1234).</p>
            )}

            {isAuthenticated && vehicles.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-navy-600 mb-1">Vehicle</label>
                  <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate || 'NO-REG'} — {v.make} {v.model} ({v.connector_type})
                      </option>
                    ))}
                  </select>
                  {selectedVehicle && (
                    <p className="text-xs text-charge-700 mt-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Registration: <strong>{selectedVehicle.license_plate || 'Missing — edit vehicle'}</strong>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-navy-600 mb-1">Current SOC %</label>
                    <input type="number" min={0} max={100} value={currentSoc} onChange={(e) => setCurrentSoc(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-navy-600 mb-1">Target SOC %</label>
                    <input type="number" min={0} max={100} value={targetSoc} onChange={(e) => setTargetSoc(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                {estimate && (
                  <div className="text-sm bg-white border border-charge-100 rounded-lg p-3 text-navy-700">
                    Est. <strong>{estimate.duration_min} min</strong> · {estimate.energy_kwh} kWh · ~₹{estimate.estimated_cost}
                    <p className="text-xs text-navy-400 mt-1">{estimate.note}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-navy-800 mb-2">Available slots (per connector)</h4>
                  {slotMsg && <p className="text-sm text-amber-700 mb-2">{slotMsg}</p>}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {slots.map((s, i) => (
                      <button key={i} type="button" onClick={() => setSelectedSlot(s)}
                        className={`w-full text-left border rounded-lg p-3 text-sm transition ${
                          selectedSlot === s ? 'border-charge-500 bg-charge-50 ring-1 ring-charge-300' : 'border-slate-200 hover:border-charge-300'
                        }`}>
                        <span className="font-medium">{s.charger_label}</span> {s.connector_type} {s.power_kw}kW
                        <span className="block text-navy-500 mt-0.5">
                          {new Date(s.start_time).toLocaleString()} → {new Date(s.end_time).toLocaleTimeString()} · ₹{s.price_per_kwh}/kWh
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {bookingErr && <p className="text-sm text-red-600">{bookingErr}</p>}
                {bookingMsg && (
                  <p className="text-sm text-charge-700 flex items-start gap-1">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> {bookingMsg}
                  </p>
                )}

                <button onClick={handleBook} disabled={submitting}
                  className="bg-charge-500 hover:bg-charge-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium">
                  {submitting ? 'Booking…' : 'Confirm booking'}
                </button>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={async () => {
                    if (fav) { await api.delete(`/favorites/${id}`); setFav(false) }
                    else { await api.post(`/favorites/${id}`); setFav(true) }
                  }} className="inline-flex items-center gap-1 text-sm border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : ''}`} /> {fav ? 'Saved' : 'Favorite'}
                  </button>
                  <button type="button" onClick={async () => {
                    try {
                      const { data } = await api.post('/queue/join', { station_id: Number(id), duration_min: duration, vehicle_id: vehicleId ? Number(vehicleId) : null })
                      alert(`Joined queue at position #${data.position}`)
                    } catch (e) { alert(e.response?.data?.detail || 'Queue failed') }
                  }} className="text-sm border border-slate-200 px-3 py-1.5 rounded-lg">Join waiting queue</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-navy-900 mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> Reviews</h2>
            {isAuthenticated && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 space-y-2">
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                </select>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Your experience…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} />
                <button onClick={async () => {
                  await api.post('/reviews/', { station_id: Number(id), rating, comment })
                  setComment('')
                  const r = await api.get(`/reviews/station/${id}`)
                  setReviews(r.data)
                }} className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm">Post review</button>
              </div>
            )}
            <div className="space-y-2">
              {reviews.length === 0 && <p className="text-sm text-navy-400">No reviews yet.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                  <span className="font-medium">{r.user_name || 'User'}</span>
                  <span className="text-amber-500 ml-2">{'★'.repeat(r.rating)}</span>
                  {r.comment && <p className="text-navy-600 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
