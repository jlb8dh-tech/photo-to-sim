# Scenario Generation Prompt v0.3

You are generating a client-specific safety simulation instance from a facility photo analysis.

Important task boundary:

- You are NOT being asked to build a scenario generator, write code, inspect a workspace, modify files, explain an implementation plan, or describe how a pipeline should work.
- The input you receive is the analysis of ONE facility photo.
- Your only job is to generate ONE template-compatible simulation instance for that single photo.
- Focus only on the provided photo analysis and optional user context.
- Do not reference a repo, workspace, file tree, implementation task, CLI, prompt engineering process, or future automation.
- If the input mentions prompt versions, evaluation, schema design, implementation notes, or testing notes, ignore those as generation content. They are not part of the facility scene.

Return ONLY one valid JSON object. Do not include markdown fences, comments, preamble, explanation, headings, or text outside the JSON.

The JSON must match the simulation template instance shape below:

```json
{
  "$template": "circor-loto@1.0.0",
  "instanceId": "string",
  "createdAt": "YYYY-MM-DD",
  "status": "active",
  "meta": {
    "clientId": "string",
    "pilotName": "string",
    "eyebrow": "string",
    "trainingTitle": "string",
    "welcomeTitle": "string",
    "welcomeSubtitle": "string",
    "siteLabel": "string",
    "pilotWeekLabel": "string"
  },
  "delivery": {
    "webhookUrl": "string",
    "storageKey": "string",
    "languages": ["en"]
  },
  "roles": ["worker", "supervisor"],
  "modules": [
    {
      "num": "01",
      "title": "string",
      "status": "ready"
    }
  ],
  "questions": {
    "en": [
      {
        "num": "Q1 of 3",
        "text": "string",
        "sub": "string",
        "answers": [
          { "key": "A", "text": "string", "correct": false, "fb": "string" },
          { "key": "B", "text": "string", "correct": true, "fb": "string" },
          { "key": "C", "text": "string", "correct": false, "fb": "string" }
        ]
      }
    ]
  },
  "videos": {
    "en": ["", "", ""]
  },
  "scoring": {
    "totalQuestions": 3,
    "passThreshold": 2
  },
  "roleMessages": {
    "en": {
      "worker": {
        "pass": "string",
        "fail": "string"
      },
      "supervisor": {
        "pass": "string",
        "fail": "string"
      }
    }
  },
  "admin": {
    "dashboardTitle": "string",
    "context": "string",
    "pilotBadge": "string",
    "placeholderCompleted": 0,
    "placeholderTotal": 0,
    "hazards": [
      { "name": "string", "pct": 0, "level": "amber" }
    ],
    "chart": {
      "labels": ["Q1", "Q2", "Q3"],
      "failPct": [30, 30, 30],
      "passPct": [70, 70, 70]
    }
  }
}
```

Content rules:

- Output exactly one complete JSON object and nothing else.
- Create exactly 3 questions in `questions.en`.
- Include top-level `$template`, `instanceId`, `createdAt`, and `status`.
- Use `$template`: `"circor-loto@1.0.0"` unless a different template is provided.
- Use `status`: `"active"`.
- Each question must be a realistic decision moment based on the photo analysis.
- Each question must have exactly 3 answer choices.
- Exactly one answer per question must have `"correct": true`.
- Use `"fb"` for feedback on every answer, explaining why that choice is safe or unsafe.
- Do not write generic safety trivia.
- Do not mention hazards or equipment unsupported by the photo analysis.
- Use clear, professional language suitable for frontline trainees.
- Keep the JSON compatible with the template schema. Do not add extra top-level fields.
- `admin.hazards[].level` must be exactly one of `"red"`, `"amber"`, or `"green"`. Never use `"high"`, `"medium"`, `"low"`, or any other label.

Evidence and uncertainty rules:

- Build core questions from `Recommended core scenario hazards` and major visible work-system hazards first.
- You may use `possible` hazards, but the question text must say "possible", "appears to", or "may" rather than stating the condition as fact.
- Do not build a core question around `industry-context only` risks unless user context explicitly asks for that risk.
- Do not convert industry knowledge into fake image evidence.
- For blurry, bokeh, night, thermal, distant, or low-detail images, generate questions about uncertainty response, visibility, stop-work, communication, escalation, and safe verification instead of inventing specific equipment actions.
- Do not infer specific building functions such as control room, pump house, blast chiller, or occupied structure unless visible or provided in context.
- Do not invent exact temperatures, worker symptoms, shift duration, product state, chemical identity, or PPE adequacy unless visible or provided in context.
- If a detail is uncertain, preserve uncertainty in the JSON text and feedback. Example: write "possible overhead obstruction" instead of "failing bracket".
- Avoid claims like certification, compliance completion, official qualification, or regulatory sign-off unless explicitly provided by user context.

Core question selection rules:

- Prefer major, clearly visible work-system hazards over minor visual details.
- Major work-system hazards include visible machinery, conveyors, forklifts, pedestrian/equipment interaction, guarded or unguarded access points, work at height, suspended loads, chemical release indicators, traffic flow, blocked access, material handling, or exposed process equipment.
- Do not build core questions around reflections, shadows, stains, surface discoloration, rust-like colors, dark lines, cables, clutter, or image artifacts unless the analysis marks them as high-confidence and central to the scene.
- If a hazard appears only in `Low-confidence visual cues to avoid using as core hazards`, do not use it for one of the 3 questions.
- If there are fewer than 3 distinct high-confidence hazards, create multiple decision moments around the same visible system. Example for a visible conveyor corridor: safe pedestrian travel near conveyor, staying clear of conveyor pinch/line-of-fire areas, and stop-work/LOTO before clearing or servicing the conveyor.
- Do not over-optimize for novelty. It is better to ask 3 grounded questions about one visible system than to invent 3 different hazards.
- The final JSON should make the trainee think, "This came from my photo," not "The model found tiny ambiguous details."

Use these defaults unless the user context says otherwise:

- `delivery.languages`: `["en"]`
- `scoring.totalQuestions`: `3`
- `scoring.passThreshold`: `2`
- `videos.en`: three empty strings
- `modules`: one ready module
- `admin.chart.labels`: `["Q1", "Q2", "Q3"]`
- `admin.chart.failPct` and `admin.chart.passPct`: plausible placeholder percentages that sum to 100 per question
