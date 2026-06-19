import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const defaultModel = "claude-sonnet-4-6";

function usage() {
  return `
Usage:
  npm run inspect -- path/to/photo.jpg

Options:
  --mock        Use local mock output; does not call Claude.
  --out <file>  Save JSON to a file.

Environment:
  ANTHROPIC_API_KEY  Required for real Claude calls.
  ANTHROPIC_MODEL    Optional. Defaults to ${defaultModel}.
`;
}

function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

function parseArgs(argv) {
  const args = { photoPath: null, mock: false, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--mock") args.mock = true;
    else if (arg === "--out") args.out = argv[++i];
    else if (!args.photoPath) args.photoPath = arg;
    else throw new Error(`Unknown extra argument: ${arg}`);
  }
  return args;
}

function mediaTypeFor(photoPath) {
  const header = readFileSync(photoPath).subarray(0, 12);
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return "image/png";
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image/jpeg";
  if (header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (["GIF87a", "GIF89a"].includes(header.subarray(0, 6).toString("ascii"))) return "image/gif";
  const ext = path.extname(photoPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  throw new Error(`Unsupported image type "${ext}". Use jpg, png, webp, or gif.`);
}

function photoIdFor(photoPath) {
  return path.basename(photoPath).replace(/\.(jpg|jpeg|png|webp|gif)$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function extractText(message) {
  return message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n").trim();
}

function parseJsonFromModel(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first < 0 || last <= first) throw new Error("Claude did not return a JSON object.");
    return JSON.parse(cleaned.slice(first, last + 1));
  }
}

function mockInspection(photoPath) {
  const name = path.basename(photoPath).toLowerCase();
  const environment = name.includes("forklift") || name.includes("warehouse")
    ? "warehouse"
    : name.includes("construction") || name.includes("scaffold")
      ? "construction site"
      : name.includes("food") || name.includes("meat")
        ? "food processing"
        : name.includes("chemical") || name.includes("refinery")
          ? "chemical facility"
          : "manufacturing floor";
  return {
    photoId: photoIdFor(photoPath),
    environment,
    imageQuality: name.includes("blur") ? "blurry" : "clear",
    hazards: [
      {
        hazard: "Possible pedestrian interaction with operating equipment",
        severity: "high",
        oshaReference: "OSHA General Duty Clause",
        confidence: name.includes("blur") ? 0.62 : 0.82
      },
      {
        hazard: "Possible machine guarding or energy-control exposure",
        severity: "high",
        oshaReference: "OSHA 1910.147 - Lockout/Tagout",
        confidence: name.includes("blur") ? 0.55 : 0.78
      },
      {
        hazard: "Walking-working surface or access-path hazard",
        severity: "medium",
        oshaReference: "OSHA 1910 Subpart D - Walking-Working Surfaces",
        confidence: name.includes("blur") ? 0.58 : 0.8
      }
    ]
  };
}

function assertValidInspection(result) {
  const errors = [];
  if (!result || typeof result !== "object" || Array.isArray(result)) errors.push("Output must be an object.");
  if (typeof result.photoId !== "string") errors.push("photoId must be a string.");
  if (typeof result.environment !== "string") errors.push("environment must be a string.");
  if (typeof result.imageQuality !== "string") errors.push("imageQuality must be a string.");
  if (!Array.isArray(result.hazards) || result.hazards.length < 1) errors.push("hazards must be a non-empty array.");
  for (const [index, hazard] of (result.hazards || []).entries()) {
    for (const key of ["hazard", "severity", "oshaReference"]) {
      if (typeof hazard[key] !== "string" || !hazard[key].trim()) errors.push(`hazards[${index}].${key} must be a non-empty string.`);
    }
    if (typeof hazard.confidence !== "number" || hazard.confidence < 0 || hazard.confidence > 1) {
      errors.push(`hazards[${index}].confidence must be a number between 0 and 1.`);
    }
  }
  if (errors.length) {
    const error = new Error("Invalid hazard JSON.");
    error.validationErrors = errors;
    throw error;
  }
}

async function runClaude(photoPath) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new Error("Missing @anthropic-ai/sdk. Run: npm install @anthropic-ai/sdk");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = readFileSync(path.join(rootDir, "prompts", "hazard-inspection.md"), "utf8");
  const imageData = readFileSync(photoPath).toString("base64");
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || defaultModel,
    max_tokens: 2200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaTypeFor(photoPath), data: imageData } },
          { type: "text", text: `${prompt}\n\nPhoto filename: ${path.basename(photoPath)}\nphotoId must be: ${photoIdFor(photoPath)}` }
        ]
      }
    ]
  });
  const text = extractText(message);
  if (!text) throw new Error("Claude returned no text.");
  return parseJsonFromModel(text);
}

function writeOutput(outPath, jsonText) {
  const absolute = path.resolve(rootDir, outPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${jsonText}\n`);
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void console.log(usage());
  if (!args.photoPath) throw new Error(`Missing photo path.\n${usage()}`);
  const photoPath = path.resolve(rootDir, args.photoPath);
  if (!existsSync(photoPath)) throw new Error(`Photo not found: ${photoPath}`);
  const result = args.mock || !process.env.ANTHROPIC_API_KEY ? mockInspection(photoPath) : await runClaude(photoPath);
  assertValidInspection(result);
  const jsonText = JSON.stringify(result, null, 2);
  if (args.out) writeOutput(args.out, jsonText);
  process.stdout.write(`${jsonText}\n`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.validationErrors) for (const validationError of error.validationErrors) console.error(`- ${validationError}`);
  process.exitCode = 1;
});
