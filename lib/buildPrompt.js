const fs = require('fs');
const path = require('path');

// Load the template schema once so Claude knows the exact output shape.
const TEMPLATE = fs.readFileSync(path.join(process.cwd(), 'template.json'), 'utf8');

/**
 * Build the system + user prompt for Claude vision.
 * Claude looks at a facility photo and emits a full sim instance JSON
 * that conforms to template.json and passes validate.js.
 */
function buildPrompt({ languages = ['en'], totalQuestions = 2, clientHint = '' } = {}) {
  const langList = languages.join(', ');

  const system = `You are a senior industrial safety trainer and instructional designer for BLCK UNICRN.
You analyze a photo of a real workplace/facility, identify the hazardous-energy and safety risks visible or strongly implied, and produce a complete, ready-to-deploy safety-training simulation as a single JSON object.

The JSON MUST conform exactly to this template schema (field names, types, and the validation rules at the bottom):

${TEMPLATE}

Hard requirements (these are checked by an automated validator — get them right):
- Output ONLY the JSON object. No prose, no markdown fences, no commentary before or after.
- Top-level keys: "$template", "instanceId", "createdAt", "status", "meta", "delivery", "roles", "modules", "scoring", "videos", "questions", "roleMessages", "admin".
- "$template" = "circor-loto@1.0.0". "status" = "active".
- delivery.languages must be exactly the requested languages.
- scoring.totalQuestions must equal the number of questions you produce in EACH language.
- scoring.passThreshold must be <= totalQuestions (use a sensible bar, e.g. all-but-one or all correct).
- For EACH language: questions[lang] has exactly totalQuestions entries; each question has 3–5 answers; EXACTLY ONE answer has "correct": true; every answer's "fb" feedback is a substantive explanation (>= 25 chars) of why it is right or wrong.
- videos[lang] is an array of placeholder filenames, length == totalQuestions (e.g. "scene_q1_en.mp4").
- roleMessages[lang] must contain an entry for EVERY role in "roles", each with non-empty "pass" and "fail" strings.
- admin.chart.labels/failPct/passPct each have length == totalQuestions, and failPct[i] + passPct[i] == 100.
- admin.hazards: 3–6 entries with name, integer pct 0–100, and level one of "red"|"amber"|"green".
- If multiple languages are requested, translate question text, answers, feedback, and roleMessages faithfully (do not leave them in English).

Content guidance:
- Ground EVERYTHING in what the photo actually shows: the type of facility, equipment, visible hazards, energy sources. Name the equipment and conditions you see.
- Write realistic, scenario-based questions (a worker faces a decision), not trivia. Reference real standards (e.g. OSHA 29 CFR 1910.147 for LOTO) where appropriate and accurate.
- Make "meta" copy specific to the facility in the photo.`;

  const user = `Analyze the attached facility photo and generate the training simulation JSON.

Parameters:
- Languages: ${langList}
- Questions per language: ${totalQuestions}
${clientHint ? `- Client / context hint: ${clientHint}` : ''}

Return ONLY the JSON object.`;

  return { system, user };
}

module.exports = { buildPrompt };
