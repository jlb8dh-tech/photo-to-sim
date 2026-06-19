import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const hazardDir = "hazard_eval";
const photosRoot = path.join(rootDir, hazardDir, "photos");
const outputRoot = path.join(rootDir, hazardDir, "results");

const defaultPhotos = [
  "construction-workers-on-scaffolding-wide.jpg",
  "manufacturing-conveyor-wide-clean.jpg",
  "food-bakery-racks-overexposed-blurry.jpg",
  "warehouse-aisle-motion-blur-worker.jpg",
  "chemical-thermal-flare-smoke-night.jpg"
];

const edgeCaseNotes = {
  "warehouse-aisle-motion-blur-worker.jpg": "Edge case: motion blur / low detail. Check whether confidence drops and the model avoids over-specific claims.",
  "chemical-thermal-flare-smoke-night.jpg": "Edge case: low-visibility thermal/night image. Check whether uncertain hazards are phrased cautiously.",
  "food-bakery-racks-overexposed-blurry.jpg": "Edge case: overexposed blurry food facility image. Check whether confidence drops and the model avoids invisible sanitation or temperature claims."
};

function stamp() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ];
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${parts.join("-")}-${time}`;
}

function runInspect(photoPath) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "inspect", "--", photoPath], {
      cwd: rootDir,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function resolvePhotoPath(photo) {
  if (path.isAbsolute(photo)) return photo;
  const directPath = path.resolve(rootDir, photo);
  if (existsSync(directPath)) return directPath;
  return path.join(photosRoot, photo);
}

function parseJson(output) {
  const first = output.indexOf("{");
  const last = output.lastIndexOf("}");
  if (first < 0 || last <= first) return { ok: false, error: "No JSON object found in stdout." };
  const jsonText = output.slice(first, last + 1);
  try {
    JSON.parse(jsonText);
    return { ok: true, jsonText };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function writeAccuracyTemplate(resultDir, photoName, parseOk) {
  const note = edgeCaseNotes[photoName] ?? "Standard case: clear image. Check whether hazards are specific and photo-grounded.";
  const content = `# Accuracy Notes: ${photoName}

JSON valid: ${parseOk ? "PASS" : "FAIL"}

${note}

| Check | Result | Notes |
|---|---|---|
| Environment is correct |  |  |
| Hazards are visible/plausible |  |  |
| OSHA references are reasonable |  |  |
| Confidence scores make sense |  |  |
| No hallucinated equipment/state |  |  |

Overall: PASS / FAIL
`;
  writeFileSync(path.join(resultDir, `${path.parse(photoName).name}.accuracy.md`), content);
}

async function main() {
  const photos = process.argv.slice(2).length ? process.argv.slice(2) : defaultPhotos;
  const resultDir = path.join(outputRoot, stamp());
  mkdirSync(resultDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    photoCount: photos.length,
    resultDir: path.relative(rootDir, resultDir),
    results: []
  };

  console.log(`Running inspection batch on ${photos.length} photo(s)...`);
  console.log(`Saving results to ${summary.resultDir}`);

  for (const photo of photos) {
    const photoPath = resolvePhotoPath(photo);
    const photoName = path.basename(photoPath);
    const baseName = path.parse(photoName).name;
    const jsonPath = path.join(resultDir, `${baseName}.json`);
    const rawPath = path.join(resultDir, `${baseName}.raw.txt`);
    const stderrPath = path.join(resultDir, `${baseName}.stderr.txt`);

    process.stdout.write(`- ${photoName} ... `);

    if (!existsSync(photoPath)) {
      const result = { photo, status: "MISSING_PHOTO", jsonValid: false, error: "Photo not found." };
      summary.results.push(result);
      console.log(result.status);
      continue;
    }

    const startedAt = Date.now();
    const run = await runInspect(photoPath);
    const parsed = parseJson(run.stdout);
    writeFileSync(rawPath, run.stdout);
    writeFileSync(stderrPath, run.stderr);
    if (parsed.ok) writeFileSync(jsonPath, `${parsed.jsonText}\n`);
    writeAccuracyTemplate(resultDir, photoName, parsed.ok);

    const result = {
      photo: path.relative(rootDir, photoPath),
      status: run.code === 0 && parsed.ok ? "NEEDS_ACCURACY_REVIEW" : "PIPELINE_FAIL",
      jsonValid: parsed.ok,
      durationMs: Date.now() - startedAt,
      output: parsed.ok ? path.relative(rootDir, jsonPath) : null,
      accuracyNotes: path.relative(rootDir, path.join(resultDir, `${baseName}.accuracy.md`)),
      rawOutput: path.relative(rootDir, rawPath),
      stderr: path.relative(rootDir, stderrPath),
      error: parsed.ok ? null : parsed.error
    };
    summary.results.push(result);
    console.log(result.status);
  }

  const summaryPath = path.join(resultDir, "summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

  const report = [
    `# Inspection Batch Report`,
    "",
    `Generated at: ${summary.generatedAt}`,
    `Photos: ${summary.photoCount}`,
    "",
    "| Photo | Status | JSON valid | Accuracy notes |",
    "|---|---|---|---|",
    ...summary.results.map((result) => `| ${result.photo} | ${result.status} | ${result.jsonValid ? "PASS" : "FAIL"} | ${result.accuracyNotes ?? ""} |`),
    "",
    "Next step: fill each `.accuracy.md` file and summarize 3 edge cases."
  ].join("\n");
  const reportPath = path.join(resultDir, "report.md");
  writeFileSync(reportPath, report);

  console.log("");
  console.log("Inspection batch complete.");
  console.log(`Report: ${path.relative(rootDir, reportPath)}`);
  console.log(`Summary: ${path.relative(rootDir, summaryPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
