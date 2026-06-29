import { NextResponse } from 'next/server';

// Poll a Runway task. GET /api/video/{id} -> { status, progress?, videoUrl?, error? }.
// Runway status values: PENDING | RUNNING | SUCCEEDED | FAILED | THROTTLED.

const BASE = 'https://api.dev.runwayml.com';
const VERSION = process.env.RUNWAY_API_VERSION || '2024-11-06';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Video unavailable — RUNWAY_API_KEY is not set.' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const r = await fetch(`${BASE}/v1/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'X-Runway-Version': VERSION,
      },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: `Runway error ${r.status}`, detail: JSON.stringify(data).slice(0, 500) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      status: data.status,
      progress: data.progress ?? null,
      videoUrl: Array.isArray(data.output) ? data.output[0] : null,
      error: data.failure || data.failureCode || null,
    });
  } catch (err) {
    console.error('video/[id] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
