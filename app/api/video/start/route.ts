import { NextResponse } from 'next/server';

// Kick off a Runway image-to-video task from the facility photo.
// POST { photoBase64, mediaType, promptText } -> { taskId } (or { mode: 'mock' }).
//
// We start the task and return immediately, then the browser polls
// /api/video/[id] — so no single request approaches the serverless timeout,
// and no job queue / cron is needed.

const BASE = 'https://api.dev.runwayml.com';
const VERSION = process.env.RUNWAY_API_VERSION || '2024-11-06';
const MODEL = process.env.RUNWAY_MODEL || 'gen4_turbo';

export async function POST(req: Request) {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) {
    // Mock mode — the UI shows a placeholder instead of polling.
    return NextResponse.json({ mode: 'mock' });
  }

  const body = await req.json().catch(() => ({}));
  const { photoBase64, mediaType = 'image/jpeg', promptText } = body || {};
  if (!photoBase64) {
    return NextResponse.json({ error: 'Missing "photoBase64".' }, { status: 400 });
  }

  const promptImage = `data:${mediaType};base64,${photoBase64}`;

  try {
    const r = await fetch(`${BASE}/v1/image_to_video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'X-Runway-Version': VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        promptImage,
        promptText: (promptText || 'Slow cinematic dolly across the facility, realistic lighting.').slice(0, 1000),
        ratio: process.env.RUNWAY_RATIO || '1280:720',
        duration: 5,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: `Runway error ${r.status}`, detail: JSON.stringify(data).slice(0, 500) },
        { status: 502 },
      );
    }
    return NextResponse.json({ taskId: data.id });
  } catch (err) {
    console.error('video/start error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
