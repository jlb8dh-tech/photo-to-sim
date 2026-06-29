import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/buildPrompt';
import { buildMockInstance } from '@/lib/mockInstance';
import { validateInstance } from '@/lib/validateInstance';

// The vision call can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

function extractJson(text: string) {
  // Claude is told to return only JSON, but strip fences / surrounding prose defensively.
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  if (t.startsWith('{')) return JSON.parse(t);
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return JSON.parse(t.slice(first, last + 1));
  throw new Error('No JSON object found in model response');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    photoBase64,
    mediaType = 'image/jpeg',
    languages = ['en'],
    totalQuestions = 2,
    clientHint = '',
  } = body || {};

  const opts = {
    languages: Array.isArray(languages) && languages.length ? languages : ['en'],
    totalQuestions: Number(totalQuestions) || 2,
    clientHint,
  };

  const audioEnabled = !!process.env.ELEVENLABS_API_KEY;

  // MOCK mode: no key set, or no photo provided. Lets the demo run end-to-end offline.
  if (!process.env.ANTHROPIC_API_KEY || !photoBase64) {
    const instance = buildMockInstance(opts);
    const validation = validateInstance(instance);
    return NextResponse.json({
      mode: process.env.ANTHROPIC_API_KEY ? 'mock-no-photo' : 'mock',
      instance,
      validation,
      audioEnabled,
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const { system, user } = buildPrompt(opts);

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: photoBase64 } },
            { type: 'text', text: user },
          ],
        },
      ],
    });

    const raw = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');

    const instance = extractJson(raw);
    const validation = validateInstance(instance);

    return NextResponse.json({ mode: 'live', model: MODEL, instance, validation, audioEnabled });
  } catch (err) {
    console.error('generate-training error:', err);
    // Fall back to a valid sample so the demo never hard-fails in front of an audience.
    const instance = buildMockInstance(opts);
    const validation = validateInstance(instance);
    return NextResponse.json({
      mode: 'error-fallback',
      error: err instanceof Error ? err.message : String(err),
      instance,
      validation,
      audioEnabled,
    });
  }
}
