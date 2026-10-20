import { Link } from 'react-router-dom'
import { MapPin, Zap, Shield, Clock, Smartphone, Building2 } from 'lucide-react'

const HERO_IMG =
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80'
const IMG_STATION =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
const IMG_CAR =
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
const IMG_CITY =
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[520px] flex items-center overflow-hidden">
        <img
          src={HERO_IMG}
          alt="EV charging"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/75 to-navy-900/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
          <p className="text-charge-300 font-medium text-sm tracking-wide uppercase mb-3">
            Maharashtra · Pune & beyond
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight max-w-xl">
            Charge smarter.<br />Travel farther.
          </h1>
          <p className="mt-4 text-lg text-navy-200 max-w-lg">
            Find compatible chargers near you, reserve a slot in minutes, and arrive with confidence —
            across Pune, Mumbai, Nashik and Nagpur.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="bg-charge-500 hover:bg-charge-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-charge-900/30 transition"
            >
              Find a charger
            </Link>
            <Link
              to="/register"
              className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['12+', 'Stations live'],
            ['Pune first', 'Expanding statewide'],
            ['24/7', 'Booking online'],
            ['3 roles', 'Drivers · Operators · Admin'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold text-charge-400">{v}</div>
              <div className="text-sm text-navy-300 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-navy-900 text-center">Everything you need to charge</h2>
        <p className="text-center text-navy-500 mt-2 max-w-2xl mx-auto">
          From discovery to check-in, EV Charge connects drivers and station partners on one platform.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: 'Map discovery', desc: 'See live stations on an interactive map. Filter by connector, power and price.' },
            { icon: Zap, title: 'Smart recommendations', desc: 'We rank stations by distance, travel time, wait and cost for your vehicle.' },
            { icon: Clock, title: 'Slot booking', desc: 'Reserve a specific connector. Get a booking ID and show your vehicle registration on arrival.' },
            { icon: Smartphone, title: 'Your garage', desc: 'Save vehicles with MH registration numbers, battery size and preferred connectors.' },
            { icon: Shield, title: 'Verified operators', desc: 'Station partners manage availability, faults and sessions — only for their sites.' },
            { icon: Building2, title: 'Business insights', desc: 'Operators and admins get utilization and revenue summaries to run the network.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-charge-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-charge-600" />
              </div>
              <h3 className="font-semibold text-navy-900">{f.title}</h3>
              <p className="text-sm text-navy-500 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Image story */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            { img: IMG_STATION, title: 'Partner stations', text: 'Trusted charging locations across Maharashtra cities.' },
            { img: IMG_CAR, title: 'Any EV', text: 'CCS, Type 2 and CHAdeMO — match your car in one click.' },
            { img: IMG_CITY, title: 'Built for Pune', text: 'Hinjewadi, Baner, Koregaon Park and more neighbourhoods covered.' },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <img src={c.img} alt={c.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-semibold text-navy-900">{c.title}</h3>
                <p className="text-sm text-navy-500 mt-1">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-navy-900">Ready for your next charge?</h2>
        <p className="text-navy-500 mt-2">Join thousands of drivers planning stops with EV Charge.</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link to="/explore" className="bg-charge-500 text-white px-6 py-3 rounded-xl font-semibold">Explore stations</Link>
          <Link to="/network" className="border border-slate-200 px-6 py-3 rounded-xl font-semibold text-navy-700">View network</Link>
        </div>
      </section>
    </div>
  )
}
