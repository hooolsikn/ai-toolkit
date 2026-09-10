import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

/* =======================================================================
 * ENV — a single .env file lives at the project root (ai-toolkit/).
 * We resolve its path from this file's own location so the server works
 * no matter which folder you run `npm run dev` from.
 * ===================================================================== */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

/* =======================================================================
 * PROMPT BUILDING
 * ===================================================================== */
const VALID_TOOLS = ["improve", "summarize", "translate", "email"];

const ALLOWED_TONES = [
  "Clearer",
  "More formal",
  "More casual",
  "More concise",
];

const ALLOWED_LENGTHS = [
  "Short",
  "Medium",
  "Bullet points",
];

const ALLOWED_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Mandarin Chinese",
  "Hindi",
  "Arabic",
  "Russian",
];

const ALLOWED_EMAIL_TONES = [
  "Friendly",
  "Professional",
  "Direct",
  "Apologetic",
];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

function pickOption(value, allowedList, fieldName) {
  if (value === undefined) {
    return allowedList[0];
  }

  if (!allowedList.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Expected one of: ${allowedList.join(", ")}.`
    );
  }

  return value;
}

function buildPrompt(tool, input, options = {}) {
  switch (tool) {
    case "improve": {
      const tone = pickOption(options.tone, ALLOWED_TONES, "tone");

      return {
        system:
          `You rewrite text to be ${tone.toLowerCase()}. ` +
          `Preserve the original meaning and length roughly. ` +
          `Return only the rewritten text, no preamble, no quotation marks.`,
        user: input,
      };
    }

    case "summarize": {
      const length = pickOption(
        options.length,
        ALLOWED_LENGTHS,
        "length"
      );

      return {
        system:
          `You summarize text. Target length/format: ${length}. ` +
          `If bullet points, use '- ' prefixed lines. ` +
          `Return only the summary, no preamble.`,
        user: input,
      };
    }

    case "translate": {
      const language = pickOption(
        options.language,
        ALLOWED_LANGUAGES,
        "language"
      );

      return {
        system:
          `You translate text into ${language}. ` +
          `Preserve tone and meaning. ` +
          `Return only the translation, nothing else.`,
        user: input,
      };
    }

    case "email": {
      const tone = pickOption(
        options.emailTone,
        ALLOWED_EMAIL_TONES,
        "emailTone"
      );

      return {
        system:
          `You write complete, ready-to-send emails in a ${tone.toLowerCase()} tone, ` +
          `based on the sender's notes about what the email needs to accomplish. ` +
          `Include a subject line as 'Subject: ...' on the first line, then a blank ` +
          `line, then the email body with a greeting and sign-off. ` +
          `Return only the email.`,
        user: input,
      };
    }

    default:
      throw new ValidationError(`Unknown tool: ${tool}`);
  }
}

/* =======================================================================
 * SERVER
 * ===================================================================== */
const PORT = process.env.PORT || 3001;
const MAX_INPUT_CHARS = 8000;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* =======================================================================
 * GEMINI
 * ===================================================================== */
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "Warning: GEMINI_API_KEY is not set. " +
      "Add your Gemini API key to the project's .env file.\n" +
      "The server will start, but every /api/generate request will fail until it is set."
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =======================================================================
 * EXPRESS
 * ===================================================================== */
const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "200kb",
  })
);

/* =======================================================================
 * RATE LIMIT
 * ===================================================================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a bit and try again.",
  },
});

app.use("/api/", limiter);

/* =======================================================================
 * HEALTH CHECK
 * ===================================================================== */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* =======================================================================
 * GENERATE
 * ===================================================================== */
app.post("/api/generate", async (req, res) => {
  const { tool, input, options } = req.body || {};

  /* ---------------------------------------------------------------------
   * 1. Validate request
   * ------------------------------------------------------------------- */
  if (!VALID_TOOLS.includes(tool)) {
    return res.status(400).json({
      error: "Unknown tool.",
    });
  }

  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({
      error: "Input text is required.",
    });
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length > MAX_INPUT_CHARS) {
    return res.status(400).json({
      error: `Input is too long (max ${MAX_INPUT_CHARS} characters).`,
    });
  }

  const safeOptions =
    options &&
    typeof options === "object" &&
    !Array.isArray(options)
      ? options
      : {};

  /* ---------------------------------------------------------------------
   * 2. Build prompt
   * ------------------------------------------------------------------- */
  let system;
  let user;

  try {
    ({ system, user } = buildPrompt(
      tool,
      trimmedInput,
      safeOptions
    ));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.status).json({
        error: err.message,
      });
    }

    throw err;
  }

  /* ---------------------------------------------------------------------
   * 3. Call Gemini
   * ------------------------------------------------------------------- */
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: 1000,
      },
    });

    const result = response.text?.trim();

    if (!result) {
      return res.status(502).json({
        error: "The model returned an empty response.",
      });
    }

    return res.json({
      result,
    });
  } catch (err) {
    console.error("generate error:", err);

    const status =
      err?.status ??
      err?.statusCode ??
      err?.response?.status;

    if (status === 401 || status === 403) {
      return res.status(500).json({
        error:
          "The server's Gemini API key is missing, invalid, or does not have access. Check the project's .env file.",
      });
    }

    if (status === 429) {
      return res.status(502).json({
        error:
          "Gemini's API is rate-limiting this server right now. Try again shortly.",
      });
    }

    return res.status(502).json({
      error:
        "The AI service failed to respond. Please try again.",
    });
  }
});

/* =======================================================================
 * START SERVER
 * ===================================================================== */
app.listen(PORT, () => {
  console.log(
    `AI Toolkit server listening on http://localhost:${PORT}`
  );

  console.log(
    `Accepting requests from CLIENT_ORIGIN=${CLIENT_ORIGIN}`
  );
});