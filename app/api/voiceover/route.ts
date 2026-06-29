import { NextResponse } from 'next/server';

// Text-to-speech via ElevenLabs. POST { text } -> audio/mpeg bytes.
// Without ELEVENLABS_API_KEY this returns 503; the UI hides the play buttons
// in that case (see audioEnabled in generate-training).

// "Rachel" — a stable default multilingual voice. Override with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Voiceover unavailable — ELEVENLABS_API_KEY is not set.' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const text: unknown = body?.text;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing "text".' }, { status: 400 });
  }
  // Guard against runaway costs / latency on a single clip.
  const clipped = text.slice(0, 1500);
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: clipped,
        model_id: MODEL,
        voice_settings: { stability: 0.4, similarity_boost: 0.75 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return NextResponse.json({ error: `ElevenLabs error ${r.status}`, detail: detail.slice(0, 500) }, { status: 502 });
    }

    const audio = await r.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('voiceover error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
