# Photo-to-Simulation — Project Docs

**Owner:** Roy · **Team:** Systems interns (Summer 2026) · **Repo:** `photo-to-sim`

This folder is the single source of truth for the Photo-to-Simulation build. If something here is wrong or unclear, that's on the doc — Slack Roy and we'll fix it. These are living documents.

## What we're building (one line)

An EHS leader uploads a photo of their facility and gets a custom, branded safety simulation in under 60 seconds — the marketing "calling card" we show prospects at ASSP and on the site.

## Start here

| # | Document | Read it if you are… |
|---|----------|----------------------|
| 1 | [Architecture](01-architecture.md) | Everyone (read first) |
| 2 | [AI Workflow Spec](02-ai-workflow-spec.md) | Workflow team (Deanna, Wenxi) |
| 3 | [Template Schema](03-template-schema.md) | Infrastructure team (Catherine, Monica) — and the AI's output contract |
| 4 | [Weekly Deliverables](04-weekly-deliverables.md) | Everyone — this is what "done" means each week |
| 5 | [PRD](05-prd.md) | Everyone (and every future intern) |
| — | [Wireframe mockup](mockup.html) | Everyone — open in a browser to see the destination |

## Ownership matrix

| Person | Team | Owns | This week's job |
|--------|------|------|-----------------|
| **Katherine** | Infrastructure | Template engine, schema, validator, renderer | Finalize `template.json` / `instance.json` contract; render an AI-generated instance |
| **Monica** | Infrastructure | Supabase, auth, data storage, admin/analytics dashboard | Stand up company Supabase; design `submissions` table |
| **Wenxi** | Workflow | Photo upload (mobile-first), Claude Vision call | Get a photo → Claude → valid scenario JSON working end to end |
| **Deanna** | Workflow | Scenario → video pipeline (Runway/Seedance + ElevenLabs) | Spec how generated questions become video + voiceover (planning, not build yet) |
| **Roy** | — | Netlify, Cloudflare Stream, GitHub, API keys/accounts, scope, lead-capture → HubSpot | Provision accounts/keys; lock scope; unblock |

Pairs, not silos — infra and workflow should talk daily. Ownership can flex; if you want to swap, raise it in the weekly sync.

## The one rule that prevents 80% of pain

The **AI output JSON** (doc 2) and the **instance schema** (doc 3) are the *same contract*. The workflow team's Claude output must be a valid instance file, and the infra team's renderer must accept it. Lock that contract before building deep on either side.

## Stack Decision
**Next.js + TypeScript**\
We chose Next.js because it handles both the frontend scenario player and backend API routes (image upload, Claude vision, Supabase reads/writes) in a single repo with a single deploy. TypeScript catches schema mismatches between template and instance files at compile time rather than runtime. Vercel deployment is zero config.\
**Supabase**\
Postgres database, auth, and storage bundled into one service with a generous free tier. Replaces the Google Sheets webhook in the current pilots. Stores scenario instances, user completions, and scores. Row-level security handles multi-tenant isolation without building a custom auth layer.\
**Cloudflare R2**\
S3-compatible object storage with no egress fees. Used for storing uploaded facility photos and generated video clips in Phase 2. AWS S3 was ruled out due to egress costs that compound as photos get viewed repeatedly across customer demos.\
**Vercel**\
Hosts the Next.js app. Free tier covers our usage, deploy previews on every PR, and zero-config integration with Next.js. Every pull request gets a clickable preview URL which makes code review faster and catches bugs before they hit production.\
**Anthropic Claude**\
Vision API for analyzing uploaded facility photos and generating scenario JSON. Well-documented, high output quality on structured JSON generation, and already in use across the team's workflows.\
**Why not alternatives**\
Plain React requires a separate backend for API routes. Express adds infra overhead not needed at this scale. Firebase has more complex pricing and vendor lock-in. GraphQL is unnecessary overhead, REST is fine at this scale.