import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

// Current stable models from ai.google.dev/gemini-api/docs/models (Sep 2026)
// Listed from fastest/cheapest to most capable
const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
];

type MiraResult = {
  evaluation: string;
  communication: number;
  relevance: number;
  structure: number;
  technicalDepth: number;
  score: number;
  strengths: string[];
  improvements: string[];
  followUpQuestion: string;
};

function extractJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function normalizeResult(data: any): MiraResult {
  const num = (value: any, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.round(n))) : fallback;
  };

  const arr = (value: any, fallback: string[]): string[] => {
    if (Array.isArray(value)) {
      return value
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, 5);
    }
    return fallback;
  };

  return {
    evaluation:
      typeof data?.evaluation === "string"
        ? data.evaluation.trim()
        : "The candidate demonstrated a reasonable understanding of the topic.",
    communication: num(data?.communication, 6),
    relevance: num(data?.relevance, 6),
    structure: num(data?.structure, 6),
    technicalDepth: num(data?.technicalDepth, 6),
    score: num(data?.score, 6),
    strengths: arr(data?.strengths, [
      "The candidate attempted to answer the question.",
      "The answer addressed the main topic.",
      "The candidate showed basic understanding.",
    ]),
    improvements: arr(data?.improvements, [
      "Provide more specific examples.",
      "Structure the answer more clearly.",
      "Add more technical detail where appropriate.",
    ]),
    followUpQuestion:
      typeof data?.followUpQuestion === "string" &&
      data.followUpQuestion.trim().length > 0
        ? data.followUpQuestion.trim()
        : "Can you explain this concept with a practical example?",
  };
}

async function callGemini(prompt: string): Promise<string> {
  let lastError: any;

  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text && text.trim()) {
        console.log(`Success with model: ${modelName}`);
        return text;
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      console.error(`Model ${modelName} failed: ${msg}`);
      lastError = err;

      // Stop immediately on auth errors
      if (
        msg.includes("API_KEY") ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("API key")
      ) {
        throw err;
      }
      // Otherwise try the next model
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

export async function POST(request: Request) {
  try {
    console.log("=================================");
    console.log("MIRA API REQUEST RECEIVED");
    console.log("=================================");

    const body = await request.json();

    const {
      question,
      answer,
      role = "Software Engineer",
      experience = "Fresher",
      interviewType = "Technical Interview",
      candidateName = "Candidate",
    } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required." },
        { status: 400 }
      );
    }

    const prompt = `You are MIRA, an AI interviewer. Evaluate the candidate's answer and return ONLY a JSON object with no markdown, no code fences, and no extra text before or after.

Candidate: ${candidateName}
Role: ${role}
Experience: ${experience}
Interview Type: ${interviewType}

Question: ${question}

Answer: ${answer}

Return this exact JSON structure:
{
  "evaluation": "2-3 sentence professional evaluation of the answer",
  "communication": 7,
  "relevance": 7,
  "structure": 7,
  "technicalDepth": 7,
  "score": 7,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "followUpQuestion": "one relevant follow-up interview question"
}

All score fields (communication, relevance, structure, technicalDepth, score) must be integers from 1 to 10.
Return ONLY the JSON object. Nothing else.`;

    const content = await callGemini(prompt);
    console.log("RAW GEMINI RESPONSE:", content);

    let parsed;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content was:", content);
      return NextResponse.json(
        { success: false, error: "MIRA returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    const result = normalizeResult(parsed);
    console.log("FINAL RESULT:", result);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("MIRA API ERROR:", error);

    const msg = String(error?.message || error);
    let userError = "MIRA could not process your answer. Please try again.";

    if (msg.includes("503") || msg.includes("high demand") || msg.includes("unavailable")) {
      userError = "MIRA is experiencing high demand. Please try again in a few seconds.";
    } else if (
      msg.includes("API_KEY") ||
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("API key")
    ) {
      userError = "API key error. Please check the GEMINI_API_KEY in Render environment variables.";
    }

    return NextResponse.json(
      { success: false, error: userError },
      { status: 500 }
    );
  }
}
