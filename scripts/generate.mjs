import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertValidInstance } from "./validate-instance.mjs";

const rootDir = process.cwd();
const defaultModel = "claude-sonnet-4-6";

function usage() {
  return `
Usage:
  npm run generate -- path/to/photo.jpg

Options:
  --mock              Force local mock output; does not call Claude.
  --out <file>        Save the validated JSON to a file.
  --customer <name>   Customer/program display name.

Environment:
  ANTHROPIC_API_KEY   Required for real Claude calls.
  ANTHROPIC_MODEL     Optional. Defaults to ${defaultModel}.
  CUSTOMER_NAME       Optional default customer/program name.

Examples:
  npm run generate -- scenario_eval/photos/warehouse-blue-forklift-near-shelves.jpg --mock
  npm run generate -- scenario_eval/photos/warehouse-blue-forklift-near-shelves.jpg --out outputs/generated/example.json
`;
}

function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs(argv) {
  const args = {
    photoPath: null,
    mock: false,
    out: null,
    customerName: process.env.CUSTOMER_NAME || "Photo-to-Simulation Pilot"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--mock") {
      args.mock = true;
    } else if (arg === "--out") {
      args.out = argv[++index];
    } else if (arg === "--customer") {
      args.customerName = argv[++index];
    } else if (!args.photoPath) {
      args.photoPath = arg;
    } else {
      throw new Error(`Unknown extra argument: ${arg}`);
    }
  }

  return args;
}

function readPrompt(name) {
  return readFileSync(path.join(rootDir, "prompts", name), "utf8");
}

function mediaTypeFor(photoPath) {
  const header = readFileSync(photoPath).subarray(0, 12);

  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "image/png";
  }

  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    header.subarray(0, 4).toString("ascii") === "RIFF" &&
    header.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    header.subarray(0, 6).toString("ascii") === "GIF87a" ||
    header.subarray(0, 6).toString("ascii") === "GIF89a"
  ) {
    return "image/gif";
  }

  const ext = path.extname(photoPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  throw new Error(`Unsupported image type "${ext}". Use jpg, png, webp, or gif for Claude vision.`);
}

function extractText(message) {
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function parseJsonFromModel(text) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("Claude did not return a JSON object.");
    }
    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "photo-sim";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function inferFacilityFromFilename(photoPath) {
  const name = path.basename(photoPath).toLowerCase();
  if (name.includes("warehouse") || name.includes("forklift")) return "warehouse";
  if (name.includes("chemical") || name.includes("refinery") || name.includes("lab")) return "chemical facility";
  if (name.includes("construction") || name.includes("scaffold") || name.includes("crane")) return "construction site";
  if (name.includes("food") || name.includes("bakery") || name.includes("canning") || name.includes("meat")) return "food processing facility";
  if (name.includes("manufacturing") || name.includes("robot") || name.includes("conveyor")) return "manufacturing floor";
  return "industrial facility";
}

function mockHazards(facilityType) {
  if (facilityType.includes("warehouse")) {
    return ["forklift traffic", "pedestrian visibility", "blocked travel paths"];
  }
  if (facilityType.includes("chemical")) {
    return ["chemical exposure", "pipe or tank leaks", "PPE and containment gaps"];
  }
  if (facilityType.includes("construction")) {
    return ["working at height", "struck-by hazards", "restricted access control"];
  }
  if (facilityType.includes("food")) {
    return ["slip hazards", "equipment pinch points", "sanitation workflow risks"];
  }
  if (facilityType.includes("manufacturing")) {
    return ["machine guarding", "moving conveyors", "maintenance lockout risk"];
  }
  return ["line-of-sight hazards", "PPE gaps", "unsafe access paths"];
}

function buildMockInstance(photoPath, customerName) {
  const facilityType = inferFacilityFromFilename(photoPath);
  const hazards = mockHazards(facilityType);
  const clientId = slugify(customerName);
  const photoSlug = slugify(path.parse(photoPath).name);
  const titleFacility = facilityType.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    $template: "circor-loto@1.0.0",
    instanceId: `${clientId}-${photoSlug}`,
    createdAt: todayIsoDate(),
    status: "active",
    meta: {
      clientId,
      pilotName: customerName,
      eyebrow: "AI-generated safety scenario",
      trainingTitle: `${titleFacility} Safety Simulation`,
      welcomeTitle: "Review the AI-generated safety scenario",
      welcomeSubtitle: "Practice three decisions based on hazards identified from the uploaded facility photo.",
      siteLabel: titleFacility,
      pilotWeekLabel: "Week 2 AI Vision Spike"
    },
    delivery: {
      webhookUrl: "",
      storageKey: `${clientId}_photo_sim_records`,
      languages: ["en"]
    },
    roles: ["worker", "supervisor"],
    modules: [
      {
        num: "01",
        title: "Photo-based hazard decisions",
        status: "ready"
      }
    ],
    questions: {
      en: [
        {
          num: "Q1 of 3",
          text: `You are entering a ${facilityType} and notice conditions related to ${hazards[0]}. What is the safest first action?`,
          sub: hazards[0],
          answers: [
            {
              key: "A",
              text: "Continue the task as planned and watch for issues while working.",
              correct: false,
              fb: "Continuing without stopping can let a visible hazard become an active incident."
            },
            {
              key: "B",
              text: "Pause, verify the hazard, and follow the site procedure before entering the work area.",
              correct: true,
              fb: "Pausing and verifying conditions gives the worker time to control the hazard before exposure."
            },
            {
              key: "C",
              text: "Ask a nearby coworker to handle the area while you move on.",
              correct: false,
              fb: "Passing the issue to someone else without controlling or reporting it does not reduce the risk."
            }
          ]
        },
        {
          num: "Q2 of 3",
          text: `During the task, you see a second concern involving ${hazards[1]}. What should you do next?`,
          sub: hazards[1],
          answers: [
            {
              key: "A",
              text: "Stop work long enough to make the condition visible and escalate if it cannot be corrected immediately.",
              correct: true,
              fb: "Stopping and escalating creates a clear control point before work continues."
            },
            {
              key: "B",
              text: "Work around the condition because it is probably temporary.",
              correct: false,
              fb: "Working around a visible concern normalizes the hazard and increases exposure."
            },
            {
              key: "C",
              text: "Wait until the end of the shift to mention it.",
              correct: false,
              fb: "Delayed reporting can leave other workers exposed during the shift."
            }
          ]
        },
        {
          num: "Q3 of 3",
          text: `A coworker is about to enter the same area while ${hazards[2]} is still unresolved. What is the best response?`,
          sub: hazards[2],
          answers: [
            {
              key: "A",
              text: "Warn the coworker, keep them clear of the hazard, and contact the responsible lead.",
              correct: true,
              fb: "Warning others and involving the lead helps control the hazard for the whole work area."
            },
            {
              key: "B",
              text: "Let them proceed because they are responsible for their own safety.",
              correct: false,
              fb: "Safety depends on shared hazard recognition, not just individual responsibility."
            },
            {
              key: "C",
              text: "Only document it later if an incident occurs.",
              correct: false,
              fb: "Documentation after an incident is too late to prevent harm."
            }
          ]
        }
      ]
    },
    videos: {
      en: ["", "", ""]
    },
    scoring: {
      totalQuestions: 3,
      passThreshold: 2
    },
    roleMessages: {
      en: {
        worker: {
          pass: "Good job recognizing the visible hazards and choosing safe stop-work decisions.",
          fail: "Review the scenario again and focus on pausing, verifying, and escalating visible hazards."
        },
        supervisor: {
          pass: "Good job reinforcing hazard recognition and clear escalation expectations.",
          fail: "Review how supervisors should help workers pause, control, and communicate hazards."
        }
      }
    },
    admin: {
      dashboardTitle: `${titleFacility} Safety Pilot`,
      context: "AI-generated photo scenario, English, mock baseline",
      pilotBadge: "AI Spike",
      placeholderCompleted: 0,
      placeholderTotal: 25,
      hazards: hazards.map((name, index) => ({
        name,
        pct: [42, 36, 28][index] ?? 25,
        level: index === 0 ? "red" : "amber"
      })),
      chart: {
        labels: ["Q1", "Q2", "Q3"],
        failPct: [30, 35, 25],
        passPct: [70, 65, 75]
      }
    }
  };
}

async function runClaude(photoPath, customerName) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new Error("Missing @anthropic-ai/sdk. Run: npm install @anthropic-ai/sdk");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || defaultModel;
  const imageData = readFileSync(photoPath).toString("base64");
  const mediaType = mediaTypeFor(photoPath);
  const visionPrompt = readPrompt("vision-analysis.md");
  const scenarioPrompt = readPrompt("scenario-generation.md");

  const visionMessage = await client.messages.create({
    model,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageData
            }
          },
          {
            type: "text",
            text: visionPrompt
          }
        ]
      }
    ]
  });

  const analysis = extractText(visionMessage);
  if (!analysis) {
    throw new Error("Claude vision analysis returned no text.");
  }

  const generationMessage = await client.messages.create({
    model,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${scenarioPrompt}

Customer/program name: ${customerName}

Photo filename: ${path.basename(photoPath)}

Vision analysis:
${analysis}`
          }
        ]
      }
    ]
  });

  const jsonText = extractText(generationMessage);
  if (!jsonText) {
    throw new Error("Claude scenario generation returned no text.");
  }

  return parseJsonFromModel(jsonText);
}

function writeOutputFile(outPath, jsonText) {
  const absolute = path.resolve(rootDir, outPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${jsonText}\n`);
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  if (!args.photoPath) {
    console.error("Missing photo path.");
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const photoPath = path.resolve(rootDir, args.photoPath);
  if (!existsSync(photoPath)) {
    console.error(`Photo not found: ${photoPath}`);
    process.exitCode = 1;
    return;
  }

  const shouldMock = args.mock || !process.env.ANTHROPIC_API_KEY;
  if (shouldMock && !args.mock) {
    console.error("ANTHROPIC_API_KEY is not set; using local mock output. Pass --mock to make this explicit.");
  }

  const instance = shouldMock
    ? buildMockInstance(photoPath, args.customerName)
    : await runClaude(photoPath, args.customerName);

  assertValidInstance(instance);
  const jsonText = JSON.stringify(instance, null, 2);

  if (args.out) {
    writeOutputFile(args.out, jsonText);
  }

  process.stdout.write(`${jsonText}\n`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.validationErrors) {
    for (const validationError of error.validationErrors) {
      console.error(`- ${validationError}`);
    }
  }
  process.exitCode = 1;
});
