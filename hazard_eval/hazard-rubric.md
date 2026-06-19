# Hazard-Only Eval Rubric

Use this rubric to manually score the inspection hazard detection CLI.

Each criterion is scored 0 or 1.

Pass threshold: 4/5.

## Criteria

| Criterion | Score | What To Check |
|---|---:|---|
| JSON validity | 0/1 | Output is valid JSON and each hazard includes `hazard`, `severity`, `oshaReference`, and `confidence`. |
| Hazard photo-grounding | 0/1 | Hazards are based on visible or strongly plausible details in the photo, not generic safety advice or invented equipment. |
| Severity reasonableness | 0/1 | Severity levels are reasonable for the visible condition. Avoid overusing `critical` unless there is immediate severe risk. |
| OSHA reference reasonableness | 0/1 | OSHA references are broadly appropriate and not over-specific unless the match is clear. |
| Confidence calibration | 0/1 | Confidence scores reflect image quality and uncertainty. Blurry, distant, low-visibility, or partially obscured hazards should have lower confidence. |

## Pass / Fail

A photo passes if it scores 4 or 5.

A photo fails if it scores 3 or below.

## Notes For Edge Cases

- Blurry or motion-blur images should not produce overconfident hazards.
- Night, thermal, or low-visibility images should use lower confidence.
- Industry-specific assumptions should not be treated as visible facts.
- Do not mark equipment as running, energized, active, damaged, leaking, overloaded, or unsecured unless the image clearly supports it.

## Example Scoring Note

Pass, 4/5. Strong hazard-only JSON with clear forklift and pedestrian-path hazards. Lost one point because the model inferred the forklift was running, which is not visible from the image.

