# Evaluation Rubric

Use this rubric to manually score each AI-generated scenario from a facility photo.
Each criterion is scored 0 or 1. A photo passes if it scores 4 out of 5 or higher.

Do not change this rubric mid-sprint. If the rubric changes, future scores cannot be compared fairly against the baseline.

## Scoring Criteria

### 1. Environment ID Accuracy

- 1 = The output correctly identifies the facility or work environment shown in the photo.
- 0 = The output identifies the wrong environment, stays too vague, or ignores the photo.

Examples:
- Pass: Calls a warehouse aisle with pallet racks a warehouse or distribution center.
- Fail: Calls the same image a chemical plant or generic workplace.

### 2. Hazard Relevance

- 1 = The hazards are visible in the photo or strongly plausible from visible details.
- 0 = The hazards are generic, unrelated, or hallucinated.

Examples:
- Pass: Mentions forklift traffic when forklifts, pallet lanes, loading docks, or warehouse aisles are visible.
- Fail: Mentions chemical spill containment when the photo only shows an office hallway.

### 3. Question Quality

- 1 = The questions are decision-oriented, realistic, and based on the scene.
- 0 = The questions are trivia, generic safety reminders, or not tied to the photo.

Examples:
- Pass: "You notice the lockout tag is missing before restarting Pump 3. What should you do?"
- Fail: "Is safety important at work?"

### 4. Answer Plausibility

- 1 = All answer choices feel like realistic choices a worker might consider, with one clearly safest answer.
- 0 = Wrong answers are cartoonishly bad, irrelevant, or too obviously fake.

Examples:
- Pass: Includes realistic tradeoffs like continuing work, stopping to verify, or escalating to a supervisor.
- Fail: Includes choices like "Ignore all rules" or "Run away immediately" unless the scene truly supports that.

### 5. Language Clarity

- 1 = The scenario is readable, professional, concise, and not overloaded with jargon.
- 0 = The scenario is confusing, awkward, overly technical, or hard for a trainee to understand.

## Pass Threshold

- Per-photo pass: 4/5 or higher.
- Week 6 target: 80% or more of the fixed eval photo set passing.

## Manual Scoring Notes

Score the generated output as written. Do not give credit for what the model probably meant.
If the JSON is invalid and cannot be read, score the photo as a fail even if the visible text seems useful.

Hard cases should stay in the set. Include blurry photos, dim lighting, unusual environments, messy scenes, and close-up shots so the eval does not become cherry-picked.
