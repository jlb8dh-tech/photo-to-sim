export default function LandingA() {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-blue-600">
            AI Safety Training Demo
          </p>
  
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Turn Workplace Photos Into Safety Training Simulations
          </h1>
  
          <p className="mt-6 text-lg text-gray-600">
            Upload a real jobsite photo and generate an interactive safety
            training scenario in minutes.
          </p>
  
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              Try the Demo
            </a>
            <a
              href="/landing-b"
              className="rounded-xl border border-gray-300 px-6 py-3 font-semibold"
            >
              View Variant B
            </a>
          </div>
        </section>
  
        <section className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h2 className="font-bold">Upload a Photo</h2>
            <p className="mt-2 text-gray-600">
              Start with a real workplace or jobsite image.
            </p>
          </div>
  
          <div className="rounded-2xl border p-6">
            <h2 className="font-bold">Generate a Scenario</h2>
            <p className="mt-2 text-gray-600">
              AI turns the photo into a custom safety simulation.
            </p>
          </div>
  
          <div className="rounded-2xl border p-6">
            <h2 className="font-bold">Train Your Team</h2>
            <p className="mt-2 text-gray-600">
              Help workers recognize hazards before incidents happen.
            </p>
          </div>
        </section>
      </main>
    );
  }