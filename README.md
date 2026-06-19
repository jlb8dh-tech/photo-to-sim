# AI Safety Prototype System

This repo contains Wenxi's AI-track prototype work for facility-photo safety analysis.

The system has two related pipelines:

1. **Photo-to-scenario pipeline**: takes a facility photo and generates a training simulation JSON.
2. **Hazard inspection pipeline**: takes a facility photo and returns a structured hazard list JSON.

**Photo-to-scenario pipeline** is week 2 focus, the current Week 4 focus is the **hazard inspection prototype**.

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local `.env` file:

```bash
cp .env.example .env
```

Then add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Do not commit `.env` to GitHub.

## Commands

Generate a full simulation scenario JSON from one photo:

```bash
npm run generate -- scenario_eval/photos/manufacturing-conveyor-wide-clean.jpg
```

Run the scenario eval batch:

```bash
npm run eval
```

Generate hazard-only inspection JSON from one photo:

```bash
npm run inspect -- hazard_eval/photos/warehouse-blue-forklift-near-shelves.jpg
```

Run the hazard inspection batch:

```bash
npm run inspect:batch
```

Run either CLI without calling Claude:

```bash
npm run inspect -- hazard_eval/photos/warehouse-blue-forklift-near-shelves.jpg --mock
npm run generate -- scenario_eval/photos/manufacturing-conveyor-wide-clean.jpg --mock
```

## Project Structure

```text
system/
├── package.json
├── .env.example
├── prompts/
├── scripts/
├── scenario_eval/
├── hazard_eval/
```

### `prompts/`

Prompt library for the AI pipelines.

- `vision-analysis.md`: first-stage visual analysis prompt for photo-to-scenario work.
- `scenario-generation.md`: second-stage prompt that converts analysis into renderer-compatible scenario JSON.
- `hazard-inspection.md`: Week 4 hazard-only prompt. This returns hazards with severity, OSHA reference, and confidence.

### `scripts/`

CLI tools and validators.

- `generate.mjs`: single-photo scenario generator.
- `eval.mjs`: batch scenario eval runner.
- `validate-instance.mjs`: validates scenario JSON against the expected instance format.
- `inspect.mjs`: single-photo hazard inspection CLI.
- `inspect-batch.mjs`: batch hazard inspection runner for the 5-photo prototype test.

### `scenario_eval/`

Photo-to-scenario evaluation workspace.

- `photos/`: 25 test facility photos across chemical, construction, food, manufacturing, and warehouse settings.
- `scenario-rubric.md`: manual scoring rubric for scenario quality.
- `scenario_results/`: saved scenario JSON outputs, raw model outputs, stderr logs, and manual score notes.

### `hazard_eval/`

Week 4 hazard inspection evaluation workspace.

- `photos/`: facility photos used for hazard-only testing.
- `hazard-rubric.md`: manual scoring rubric for hazard JSON.
- `results/`: saved hazard inspection outputs by run timestamp.

Each hazard inspection result usually includes:

- `.json`: parsed model output.
- `.raw.txt`: full raw CLI/model output.
- `.stderr.txt`: errors or warnings printed during the run.
- `.accuracy.md`: manual scoring notes for that photo.
- `summary.json`: machine-readable batch summary.
- `report.md`: human-readable batch report.


## Output Schemas

### Scenario JSON

The scenario pipeline outputs renderer-compatible simulation JSON. It is validated by `scripts/validate-instance.mjs`.

Use this when the goal is:

```text
photo -> training simulation -> renderer
```

### Hazard Inspection JSON

The hazard-only prototype outputs:

```json
{
  "photoId": "warehouse-blue-forklift-near-shelves",
  "environment": "Indoor warehouse / storage facility",
  "imageQuality": "clear",
  "hazards": [
    {
      "hazard": "Forklift forks extended into a pedestrian travel area",
      "severity": "high",
      "oshaReference": "OSHA 1910.178 - Powered Industrial Trucks",
      "confidence": 0.92
    }
  ]
}
```

Use this when the goal is:

```text
photo -> structured hazard list
```

## Evaluation Rubrics

### Scenario Eval

The scenario rubric scores whether the model:

- identifies the environment correctly,
- uses hazards that are visible or plausible,
- writes decision-oriented questions,
- gives realistic answer choices,
- uses clear professional language.

Pass threshold: **4/5**.

### Hazard Eval

The hazard rubric scores whether the model:

- returns valid JSON,
- grounds hazards in the photo,
- assigns reasonable severity,
- uses reasonable OSHA references,
- calibrates confidence appropriately.

Pass threshold: **4/5**.

## Tracking Docs

- [AI Eval Scorecard / Google Sheet](https://docs.google.com/spreadsheets/d/1fAEO4Rpa9v_z3Oj9J-KQsouNEdbxKgnZJtmI78777Wg/edit?gid=413984191#gid=413984191)
- [Prompt Library + Lessons Learned / Google Doc](https://docs.google.com/document/d/1p46clhAniKOgp9eFJEbRotODrDmSanlPu6ZDKE6mJk0/edit?tab=t.0)

## Current Prototype Status

Hazard inspection prototype:

- CLI exists: `npm run inspect`
- Batch test exists: `npm run inspect:batch`
- Prompt saved in `prompts/hazard-inspection.md`
- Rubric saved in `hazard_eval/hazard-rubric.md`
- 5-photo test set includes clear, blurry, motion-blur, and low-visibility edge cases
- Latest 5-photo run produced valid JSON for all tested images
