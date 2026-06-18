export default function LandingB() {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-cyan-300">
            Photo-to-Sim Safety Training
          </p>
  
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Build Custom Safety Training Without Filming New Videos
          </h1>
  
          <p className="mt-6 text-lg text-slate-300">
            Turn real workplace images into realistic AI-powered training
            scenarios for construction, industrial, and operations teams.
          </p>
  
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/"
              className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
            >
              Create Your First Simulation
            </a>
            <a
              href="/landing-a"
              className="rounded-xl border border-slate-600 px-6 py-3 font-semibold"
            >
              View Original Variant
            </a>
          </div>
        </section>
  
        <section className="mx-auto mt-16 max-w-4xl rounded-3xl bg-slate-900 p-8">
          <h2 className="text-2xl font-bold">Why safety teams use it</h2>
  
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <p>✓ Build training content faster</p>
            <p>✓ Adapt scenarios to each workplace</p>
            <p>✓ Reduce dependency on video production</p>
            <p>✓ Make safety training feel more realistic</p>
          </div>
        </section>
      </main>
    );
  }