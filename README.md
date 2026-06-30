# Photo-to-Sim — BLCK UNICRN

Drop a photo of a facility. Claude reads the visible hazards and writes a complete,
deployable safety-training simulation — scenario-based questions, multiple-choice answers
with feedback, role-specific result messages, and an admin dashboard — as a single JSON
instance that conforms to the BLCK UNICRN sim template and **passes `validate.js`**.

Built on Next.js (App Router) + TypeScript + Tailwind, with Supabase email/password auth.

## How it works

```
facility photo ──▶ /api/generate-training ──▶ Claude vision (with template.json as the schema)
                                          ──▶ instance JSON ──▶ validateInstance() ──▶ interactive sim
```

The key design choice: the existing `template.json` **is** the output contract. Claude is
given the template schema and must emit an instance that drops straight into your real sim
and survives the validator.

**ElevenLabs voiceover** is wired in: when `ELEVENLABS_API_KEY` is set, each scenario gets a
**Play scenario** button that streams TTS audio.

**Runway video** is wired in too: with `RUNWAY_API_KEY` set, **Generate video** turns the
uploaded photo into a short cinematic clip (gen4_turbo). It uses a *start + client-poll*
design — `/api/video/start` kicks off the task and returns immediately, then the browser polls
`/api/video/[id]` — so no request approaches the serverless timeout and no job queue is needed.

Both audio and video degrade gracefully: without the key, audio buttons hide and the video
panel shows a mock preview; everything else works unchanged.

## Run locally

```bash
npm install
cp .env.example .env.local   # add keys (all optional — see below)
npm run dev                  # http://localhost:3000
```

**No API key?** The app runs in **mock mode** — `/api/generate-training` returns a valid sample
sim so the whole UI is demoable offline. Set `ANTHROPIC_API_KEY` for live generation from real
photos. If live generation errors, the API falls back to the sample instead of hard-failing.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Live photo → sim generation. Unset → mock mode. |
| `ANTHROPIC_MODEL` | Optional model override. |
| `ELEVENLABS_API_KEY` | Enables the "Play scenario" voiceover buttons. |
| `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` | Optional voice/model overrides. |
| `RUNWAY_API_KEY` | Enables "Generate video" (image-to-video). Unset → mock preview. |
| `RUNWAY_MODEL` / `RUNWAY_API_VERSION` / `RUNWAY_RATIO` | Optional Runway overrides. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth (login/signup). |

## Project layout

```
app/
  page.tsx                       Photo-to-Sim tool (home) — upload UI + interactive sim renderer
  layout.tsx                     Root layout
  login/ signup/ auth/callback/  Supabase email/password auth
  api/generate-training/route.ts Photo → Claude vision → validated instance JSON
  api/voiceover/route.ts         Scenario text → ElevenLabs TTS → audio/mpeg
  api/video/start/route.ts       Photo → start Runway image-to-video task
  api/video/[id]/route.ts        Poll a Runway task → status + video URL
lib/
  buildPrompt.js                 Builds the Claude prompt from template.json
  mockInstance.js                Deterministic sample sim (offline / fallback)
  validateInstance.js            Shared validator (pure function)
  supabase.ts                    Supabase browser client
template.json                    The sim schema — the output contract
instance-circor.json             Hand-authored CIRCOR example
validate.js                      CLI validator:  node validate.js [instance.json]
```

## Validate any instance

```bash
npm run validate                       # validates instance-circor.json
node validate.js path/to/instance.json # or any file
```

The UI shows the same pass/warn/error report live, with a **Download instance JSON** button.

## Deploy (Vercel)

1. Connect the repo to Vercel (auto-detects Next.js).
2. Set the environment variables above in **Settings → Environment Variables**.
3. Push → Vercel builds and deploys. The vision call runs within the serverless timeout —
   no job queue needed for this MVP.

## Notes

- **Runway API version** is pinned via `RUNWAY_API_VERSION` (default `2024-11-06`) and the model
  via `RUNWAY_MODEL` (default `gen4_turbo`) — bump either with an env var, no code change.
