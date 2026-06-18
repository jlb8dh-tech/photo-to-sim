const keywordGroups = [
    {
      name: "Workplace Safety Training",
      keywords: [
        "workplace safety training",
        "employee safety training",
        "online safety training",
        "safety training software",
        "workplace safety software",
        "osha safety training",
        "safety compliance training",
        "industrial safety training",
        "safety training platform",
        "digital safety training",
      ],
    },
    {
      name: "Construction Safety",
      keywords: [
        "construction safety training",
        "construction hazard training",
        "jobsite safety training",
        "construction safety software",
        "construction safety program",
        "construction safety compliance",
        "construction worker training",
        "construction site hazard training",
        "construction safety videos",
        "construction safety simulation",
      ],
    },
    {
      name: "AI Safety Simulation",
      keywords: [
        "ai safety training",
        "ai training simulation",
        "safety simulation software",
        "virtual safety training",
        "interactive safety training",
        "photo based training",
        "hazard detection training",
        "workplace hazard simulation",
        "immersive safety training",
        "ai workplace training",
      ],
    },
  ];
  
  const adVariants = [
    ["Turn Photos Into Safety Training", "Create realistic safety simulations from workplace photos in minutes.", "Try the Demo"],
    ["AI Safety Training for Teams", "Help employees recognize hazards faster with interactive AI simulations.", "Book a Demo"],
    ["Train Workers Before Accidents Happen", "Use photo-based simulations to improve hazard awareness and readiness.", "Start Training"],
    ["Modernize Workplace Safety", "Replace static safety slides with AI-generated training scenarios.", "See It Live"],
    ["Photo-to-Sim Safety Training", "Upload a jobsite photo and generate a realistic safety simulation.", "Try Photo-to-Sim"],
    ["Build Safety Simulations Faster", "Create custom training scenarios without expensive video production.", "Get Started"],
    ["Interactive Hazard Training", "Help teams identify risks through realistic AI-powered scenarios.", "View Demo"],
    ["Safety Training That Feels Real", "Turn real workplace environments into immersive training experiences.", "Explore Demo"],
    ["Reduce Safety Training Friction", "Generate job-specific safety content from simple site photos.", "Learn More"],
    ["AI-Powered OSHA Training Support", "Create realistic safety scenarios to support compliance and readiness.", "Request Demo"],
  ];
  
  export default function AdsPage() {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-blue-600">
            Google Ads Prototype
          </p>
  
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            AI Safety Training Campaign
          </h1>
  
          <p className="mt-5 max-w-3xl text-lg text-slate-600">
            Campaign structure for driving paid search traffic to the
            Photo-to-Sim safety training demo.
          </p>
  
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/landing-a"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              View Landing A
            </a>
            <a
              href="/landing-b"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              View Landing B
            </a>
          </div>
        </section>
  
        <section className="mx-auto mt-12 max-w-6xl">
          <h2 className="text-2xl font-bold">Campaign Structure</h2>
  
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {keywordGroups.map((group) => (
              <div
                key={group.name}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold">{group.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {group.keywords.length} keywords
                </p>
  
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {group.keywords.map((keyword) => (
                    <li key={keyword} className="rounded-lg bg-slate-100 px-3 py-2">
                      {keyword}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
  
        <section className="mx-auto mt-14 max-w-6xl">
          <h2 className="text-2xl font-bold">AI-Generated Ad Copy Variants</h2>
          <p className="mt-2 text-slate-600">
            10 Google Ads variants with headline, description, and CTA.
          </p>
  
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {adVariants.map(([headline, description, cta], index) => (
              <div
                key={headline}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-blue-600">
                  Variant {index + 1}
                </p>
  
                <h3 className="mt-2 text-xl font-bold">{headline}</h3>
  
                <p className="mt-3 text-slate-600">{description}</p>
  
                <p className="mt-4 font-semibold text-slate-900">
                  CTA: {cta}
                </p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="mx-auto mt-14 max-w-6xl rounded-3xl bg-slate-900 p-8 text-white">
          <h2 className="text-2xl font-bold">Prototype Status</h2>
  
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-3xl font-bold">3</p>
              <p className="text-slate-300">Keyword groups</p>
            </div>
  
            <div>
              <p className="text-3xl font-bold">30</p>
              <p className="text-slate-300">Total keywords</p>
            </div>
  
            <div>
              <p className="text-3xl font-bold">10</p>
              <p className="text-slate-300">Ad copy variants</p>
            </div>
          </div>
  
          <p className="mt-6 text-slate-300">
            Campaign is ready to be connected to a paused Google Ads setup after
            approval before any spend kicks off.
          </p>
        </section>
      </main>
    );
  }