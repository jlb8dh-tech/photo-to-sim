import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generate(imagePath) {
  // 1. Read and base64-encode the image
  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(absolutePath);
  const base64Data = imageBuffer.toString("base64");

  const ext = path.extname(imagePath).toLowerCase();
  const mediaTypeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mediaType = mediaTypeMap[ext] ?? "image/jpeg";

  // 2. Call the Anthropic API
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          {
            type: "text",

            text: `You are a safety analyst reviewing a photo of an industrial work site.
            Only reference things that are actually visible in the photo. Do not infer or assume.

            Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
            {
              "environment": "brief description of the setting",
              "equipment": ["item 1", "item 2", "item 3"],
              "hazards": [
                { "hazard": "name", "reason": "why it is dangerous" },
                { "hazard": "name", "reason": "why it is dangerous" },
                { "hazard": "name", "reason": "why it is dangerous" }
              ]
            }`,
          },
        ],
      },
    ],
  });

  // 3. Parse and print JSON
  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed;
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { raw: rawText };
  }

  console.log(JSON.stringify(parsed, null, 2));
}

// Entry point
const [, , imagePath] = process.argv;
if (!imagePath) {
  console.error("Usage: npm run generate -- path/to/photo.jpg");
  process.exit(1);
}

generate(imagePath).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});