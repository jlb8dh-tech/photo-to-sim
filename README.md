# Photo-to-Sim — BLCK UNICRN

Drop a photo of a facility. Claude reads the visible hazards and writes a complete,
deployable safety-training simulation — scenario-based questions, multiple-choice answers
with feedback, role-specific result messages, and an admin dashboard — as a single JSON
instance that conforms to the BLCK UNICRN sim template and **passes `validate.js`**.

## How it works

```
facility photo ──▶ /api/generate-training ──▶ Claude vision (with template.json as the schema)
                                          ──▶ instance JSON  ──▶ validateInstance()  ──▶ UI renders interactive sim
```

The key design choice: the existing `template.json` **is** the output contract. Claude is
given the template schema and must emit an instance that drops straight into your real sim
and survives the validator. No bespoke demo format.

**ElevenLabs voiceover** is wired in: when `ELEVENLABS_API_KEY` is set, each scenario gets a
**Play scenario** button that streams TTS audio. Without the key, the buttons are hidden and
the rest of the app works unchanged. Runway video remains deferred (see *Next phases*).

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for live generation
npm run dev                  # http://localhost:3000
```

**No API key?** The app runs in **mock mode** — it returns a valid sample sim so the whole
UI is demoable offline. Set `ANTHROPIC_API_KEY` to switch to live generation from real photos.

If live generation ever errors (bad photo, model hiccup), the API falls back to the sample
instance rather than hard-failing — useful in front of an audience.

## Project layout

```
pages/
  index.js                  Upload UI + interactive sim renderer (BLCK UNICRN theme)
  api/generate-training.js  Photo → Claude vision → validated instance JSON
  api/voiceover.js          Scenario text → ElevenLabs TTS → audio/mpeg
lib/
  buildPrompt.js            Builds the Claude prompt from template.json
  mockInstance.js           Deterministic sample sim (offline / fallback)
  validateInstance.js       Shared validator (pure function)
template.json               The sim schema — the output contract
instance-circor.json        Hand-authored CIRCOR example
validate.js                 CLI validator:  node validate.js [instance.json]
```

## Validate any instance

```bash
npm run validate                       # validates instance-circor.json
node validate.js path/to/instance.json # or any file
```

The UI shows the same pass/warn/error report live, and a **Download instance JSON** button
exports the generated sim.

## Deploy (Vercel)

1. Connect the repo to Vercel (auto-detects Next.js — no config needed).
2. Set environment variables in **Settings → Environment Variables**:
   - `ANTHROPIC_API_KEY` (required for live generation)
   - `ANTHROPIC_MODEL` (optional; defaults to a current Claude model)
3. Push to your deploy branch → Vercel builds and deploys.

The vision call runs synchronously and completes well within the serverless timeout —
no job queue needed for this MVP.

## Next phases (deferred, higher risk)

- **Runway video** — needs verified API format + proper async handling (job queue / webhooks),
  since video generation exceeds the serverless timeout. Wire this in only after the core is solid.
