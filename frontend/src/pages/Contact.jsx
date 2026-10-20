export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">Contact & Support</h1>
      <p className="mt-4 text-navy-600 leading-relaxed">
        EV Charge Maharashtra — support for drivers and station operators in Pune and across the state.
      </p>
      <div className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div>
          <h3 className="font-semibold text-navy-900">Email</h3>
          <p className="text-navy-500 text-sm mt-1">support@evcharge.in</p>
        </div>
        <div>
          <h3 className="font-semibold text-navy-900">Helpline</h3>
          <p className="text-navy-500 text-sm mt-1">+91 20 4850 2200</p>
        </div>
        <div>
          <h3 className="font-semibold text-navy-900">Coverage</h3>
          <p className="text-navy-500 text-sm mt-1">Pune, Mumbai, Nashik, Nagpur and expanding across Maharashtra</p>
        </div>
      </div>
    </div>
  )
}
