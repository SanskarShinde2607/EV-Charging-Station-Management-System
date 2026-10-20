import { Link } from 'react-router-dom'
import { Search, Car, CalendarCheck, PlugZap } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: '1. Find a station',
    desc: 'Open the map, allow location, and filter by connector type, power and price. See distance and estimated travel time.',
  },
  {
    icon: Car,
    title: '2. Add your vehicle',
    desc: 'Save make, model and Maharashtra registration (e.g. MH14AB1234). We use this for compatibility and station check-in.',
  },
  {
    icon: CalendarCheck,
    title: '3. Book a slot',
    desc: 'Choose battery level targets, pick an available connector time slot, and confirm. You receive a booking ID instantly.',
  },
  {
    icon: PlugZap,
    title: '4. Charge & go',
    desc: 'Arrive on time. The operator verifies your registration, starts charging, and marks the session complete when you leave.',
  },
]

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900 text-center">How EV Charge works</h1>
      <p className="text-center text-navy-500 mt-2 max-w-xl mx-auto">
        Four simple steps from search to a completed charge — designed for everyday drivers in Maharashtra.
      </p>

      <div className="mt-12 grid sm:grid-cols-2 gap-6">
        {steps.map((s) => (
          <div key={s.title} className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="w-11 h-11 rounded-xl bg-charge-50 flex items-center justify-center mb-4">
              <s.icon className="w-5 h-5 text-charge-600" />
            </div>
            <h3 className="font-semibold text-navy-900 text-lg">{s.title}</h3>
            <p className="text-sm text-navy-500 mt-2 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl overflow-hidden relative h-48">
        <img
          src="https://images.unsplash.com/photo-1617886322168-72b886573c5e?auto=format&fit=crop&w=1200&q=80"
          alt="Charging in progress"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-900/60 flex items-center justify-center">
          <Link to="/register" className="bg-charge-500 text-white px-6 py-3 rounded-xl font-semibold">
            Get started free
          </Link>
        </div>
      </div>
    </div>
  )
}
