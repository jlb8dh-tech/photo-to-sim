import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const photosDir = path.join(rootDir, "scenario_eval", "photos");
const resultsRoot = path.join(rootDir, "scenario_eval", "scenario_results");
const packageJsonPath = path.join(rootDir, "package.json");

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);

function usage() {
  return `
Usage:
  npm run eval

Before running:
  1. Put 20-30 facility photos in scenario_eval/photos/
  2. Connect the AI pipeline in one of these ways:
     - Add a package script named "generate" that accepts a photo path:
       npm run generate -- scenario_eval/photos/example.jpg
     - Or set EVAL_PIPELINE_CMD, using {photo} as the placeholder:
       EVAL_PIPELINE_CMD='node scripts/generate.mjs {photo}' npm run eval

Optional:
  EVAL_RUN_NAME=baseline npm run eval
`;
}

function todayStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

function getPhotos() {
  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true });
  }

  return readdirSync(photosDir)
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .sort()
    .map((file) => path.join(photosDir, file));
}

function getPackageScripts() {
  if (!existsSync(packageJsonPath)) return {};
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return pkg.scripts ?? {};
}

function resolvePipelineCommand(photoPath) {
  const customCommand = process.env.EVAL_PIPELINE_CMD;

  if (customCommand) {
    return {
      command: customCommand.replaceAll("{photo}", JSON.stringify(photoPath)),
      shell: true
    };
  }

  const scripts = getPackageScripts();
  if (scripts.generate) {
    return {
      command: "npm",
      args: ["run", "generate", "--", photoPath],
      shell: false
    };
  }

  return null;
}

function runCommand(commandSpec) {
  return new Promise((resolve) => {
    const child = spawn(commandSpec.command, commandSpec.args ?? [], {
      cwd: rootDir,
      shell: commandSpec.shell,
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function parseJsonFromOutput(output) {
  const trimmed = output.trim();
  if (!trimmed) return { ok: false, error: "Pipeline produced no stdout." };

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    JSON.parse(withoutFence);
    return { ok: true, jsonText: withoutFence };
  } catch (firstError) {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = withoutFence.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return { ok: true, jsonText: candidate };
      } catch {
        return { ok: false, error: firstError.message };
      }
    }

    return { ok: false, error: firstError.message };
  }
}

function writeManualScorecard(resultDir, photoName, jsonParseOk) {
  const baseName = path.parse(photoName).name;
  const scorecardPath = path.join(resultDir, `${baseName}.score.md`);
  const content = `# Manual Scorecard: ${photoName}

JSON parse check: ${jsonParseOk ? "PASS" : "FAIL"}

Score each criterion as 0 or 1.

| Criterion | Score | Notes |
|---|---:|---|
| Environment ID accuracy |  |  |
| Hazard relevance |  |  |
| Question quality |  |  |
| Answer plausibility |  |  |
| Language clarity |  |  |
| Total |  | Pass requires 4/5 |

Final result: PASS / FAIL
`;

  writeFileSync(scorecardPath, content);
}

async function main() {
  const photos = getPhotos();
  const runName = process.env.EVAL_RUN_NAME || todayStamp();
  const resultDir = path.join(resultsRoot, runName);
  mkdirSync(resultDir, { recursive: true });

  if (photos.length === 0) {
    console.log("No eval photos found.");
    console.log(`Created ${path.relative(rootDir, photosDir)}. Add 20-30 facility photos there, then run npm run eval again.`);
    console.log(usage());
    process.exitCode = 1;
    return;
  }

  const pipelineCommand = resolvePipelineCommand(photos[0]);
  if (!pipelineCommand) {
    console.log("No AI pipeline command configured.");
    console.log("Add a package script named \"generate\" or set EVAL_PIPELINE_CMD.");
    console.log(usage());
    process.exitCode = 1;
    return;
  }

  const summary = {
    runName,
    photoCount: photos.length,
    resultDir: path.relative(rootDir, resultDir),
    generatedAt: new Date().toISOString(),
    results: []
  };

  console.log(`Running eval on ${photos.length} photo(s)...`);
  console.log(`Saving results to ${summary.resultDir}`);

  for (const photoPath of photos) {
    const photoName = path.basename(photoPath);
    const baseName = path.parse(photoName).name;
    const commandSpec = resolvePipelineCommand(photoPath);
    const outputPath = path.join(resultDir, `${baseName}.json`);
    const rawPath = path.join(resultDir, `${baseName}.raw.txt`);
    const errorPath = path.join(resultDir, `${baseName}.stderr.txt`);

    process.stdout.write(`- ${photoName} ... `);
    const startedAt = Date.now();
    const run = await runCommand(commandSpec);
    const durationMs = Date.now() - startedAt;
    const parsed = parseJsonFromOutput(run.stdout);

    writeFileSync(rawPath, run.stdout || "");
    writeFileSync(errorPath, run.stderr || "");

    if (parsed.ok) {
      writeFileSync(outputPath, `${parsed.jsonText}\n`);
    }

    writeManualScorecard(resultDir, photoName, parsed.ok);

    const result = {
      photo: path.relative(rootDir, photoPath),
      exitCode: run.code,
      durationMs,
      jsonParseOk: parsed.ok,
      output: parsed.ok ? path.relative(rootDir, outputPath) : null,
      rawOutput: path.relative(rootDir, rawPath),
      stderr: path.relative(rootDir, errorPath),
      scorecard: path.relative(rootDir, path.join(resultDir, `${baseName}.score.md`)),
      status: run.code === 0 && parsed.ok ? "NEEDS_MANUAL_SCORE" : "PIPELINE_FAIL",
      error: parsed.ok ? null : parsed.error
    };

    summary.results.push(result);
    console.log(result.status);
  }

  const parsePasses = summary.results.filter((result) => result.jsonParseOk).length;
  const pipelineFailures = summary.results.length - parsePasses;
  summary.parsePasses = parsePasses;
  summary.pipelineFailures = pipelineFailures;

  const summaryPath = path.join(resultDir, "summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

  const reportLines = [
    `# Eval Report: ${runName}`,
    "",
    `Generated at: ${summary.generatedAt}`,
    `Photos: ${summary.photoCount}`,
    `JSON parse pass: ${parsePasses}`,
    `Pipeline/json failures: ${pipelineFailures}`,
    "",
    "Manual scoring required: fill in each `.score.md` file using scenario_eval/scenario-rubric.md.",
    "",
    "| Photo | Pipeline status | JSON parse | Scorecard |",
    "|---|---|---|---|",
    ...summary.results.map((result) => {
      const scorecard = result.scorecard.replaceAll("|", "\\|");
      return `| ${result.photo} | ${result.status} | ${result.jsonParseOk ? "PASS" : "FAIL"} | ${scorecard} |`;
    }),
    ""
  ];

  const reportPath = path.join(resultDir, "report.md");
  writeFileSync(reportPath, reportLines.join("\n"));

  console.log("");
  console.log("Eval run complete.");
  console.log(`Report: ${path.relative(rootDir, reportPath)}`);
  console.log(`Summary: ${path.relative(rootDir, summaryPath)}`);
  console.log("");
  console.log("Next step: manually score each .score.md file using scenario_eval/scenario-rubric.md.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
