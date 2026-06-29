// Text-to-speech via ElevenLabs. POST { text, language } -> audio/mpeg bytes.
// The frontend wraps the response in a blob URL and plays it.
//
// Without ELEVENLABS_API_KEY this returns 503 with a clear message; the UI
// hides the play buttons in that case (see audioEnabled in generate-training).

export const config = {
  api: { bodyParser: { sizeLimit: '256kb' } },
};

// "Rachel" — a stable default multilingual voice. Override with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Voiceover unavailable — ELEVENLABS_API_KEY is not set.' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing "text".' });
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
      return res.status(502).json({ error: `ElevenLabs error ${r.status}`, detail: detail.slice(0, 500) });
    }

    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audio);
  } catch (err) {
    console.error('voiceover error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
