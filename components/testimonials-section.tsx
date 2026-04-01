export function TestimonialsSection() {
  const useCases = [
    {
      title: 'Document ownership properly',
      description:
        'Keep the photos, serial numbers, and notes that make your property easier to identify when proof matters most.',
    },
    {
      title: 'Respond faster to theft',
      description:
        'Move from a stored item record to a stolen report quickly, instead of searching old chats, receipts, and image folders.',
    },
    {
      title: 'Check before you buy',
      description:
        'Search reported items before purchasing second-hand goods so you can avoid suspicious property with more confidence.',
    },
  ]

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
            Why people choose
            <span className="block bg-gradient-to-r from-[#336699] to-[#0F2651] bg-clip-text text-transparent">
              Catcher
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Catcher is most useful when it reduces confusion. These are the three
            jobs the platform is designed to handle well.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/50 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-6 inline-flex rounded-full bg-[#36689e]/10 px-4 py-2 text-sm font-semibold text-[#0F2651]">
                Core workflow
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-4 leading-relaxed text-slate-700">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          <div>
            <div className="mb-2 text-2xl font-bold text-slate-900">Registration</div>
            <div className="text-slate-600">
              Save item details in an organized dashboard.
            </div>
          </div>
          <div>
            <div className="mb-2 text-2xl font-bold text-slate-900">Reporting</div>
            <div className="text-slate-600">
              Create stolen reports from real user-owned records.
            </div>
          </div>
          <div>
            <div className="mb-2 text-2xl font-bold text-slate-900">Verification</div>
            <div className="text-slate-600">
              Check public stolen-item records before purchase.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
