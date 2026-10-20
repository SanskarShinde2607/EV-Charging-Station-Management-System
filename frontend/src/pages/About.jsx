import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80"
        alt="Electric mobility"
        className="w-full h-56 object-cover rounded-2xl mb-8"
      />
      <h1 className="text-3xl font-bold text-navy-900">About EV Charge</h1>
      <p className="mt-4 text-navy-600 leading-relaxed">
        EV Charge is Maharashtra’s digital platform for discovering and booking electric vehicle
        charging. We connect drivers with station partners so you can plan a stop, reserve a connector,
        and check in with your vehicle registration number.
      </p>
      <p className="mt-4 text-navy-600 leading-relaxed">
        Our network focuses first on <strong>Pune</strong> — including Hinjewadi, Baner, Koregaon Park,
        Kothrud, Hadapsar and more — and extends to Mumbai, Nashik and Nagpur.
      </p>
      <h2 className="text-xl font-semibold text-navy-900 mt-10">Who we serve</h2>
      <ul className="mt-4 space-y-3 text-navy-600">
        <li><strong>Drivers</strong> — find stations, book slots, manage vehicles and raise support queries.</li>
        <li><strong>Station operators</strong> — manage sites, verify arrivals, run sessions and view performance.</li>
        <li><strong>Network admin</strong> — onboard partners, monitor the platform and resolve escalations.</li>
      </ul>
      <h2 className="text-xl font-semibold text-navy-900 mt-10">Our promise</h2>
      <p className="mt-3 text-navy-600 leading-relaxed">
        Clear availability, fair recommendations, and conflict-free reservations on each connector —
        so you spend less time waiting and more time on the road.
      </p>
      <Link to="/explore" className="inline-block mt-8 bg-charge-500 text-white px-5 py-2.5 rounded-lg font-medium">
        Browse stations
      </Link>
    </div>
  )
}
