import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // If there is extra text before/after JSON,
  // extract the JSON object.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function normalizeResult(data: any): MiraResult {
  const numberOrDefault = (
    value: any,
    fallback: number
  ): number => {
    const n = Number(value);

    if (Number.isFinite(n)) {
      return Math.min(10, Math.max(1, Math.round(n)));
    }

    return fallback;
  };

  const stringArray = (
    value: any,
    fallback: string[]
  ): string[] => {
    if (Array.isArray(value)) {
      return value
        .filter(
          (item) =>
            typeof item === "string" &&
            item.trim().length > 0
        )
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

    communication: numberOrDefault(
      data?.communication,
      6
    ),

    relevance: numberOrDefault(
      data?.relevance,
      6
    ),

    structure: numberOrDefault(
      data?.structure,
      6
    ),

    technicalDepth: numberOrDefault(
      data?.technicalDepth,
      6
    ),

    score: numberOrDefault(
      data?.score,
      6
    ),

    strengths: stringArray(
      data?.strengths,
      [
        "The candidate attempted to answer the question.",
        "The answer addressed the main topic.",
        "The candidate showed basic understanding.",
      ]
    ),

    improvements: stringArray(
      data?.improvements,
      [
        "Provide more specific examples.",
        "Structure the answer more clearly.",
        "Add more technical detail where appropriate.",
      ]
    ),

    followUpQuestion:
      typeof data?.followUpQuestion === "string" &&
      data.followUpQuestion.trim().length > 0
        ? data.followUpQuestion.trim()
        : "Can you explain this concept with a practical example?",
  };
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

    console.log("Candidate:", candidateName);
    console.log("Role:", role);
    console.log("Experience:", experience);
    console.log("Interview Type:", interviewType);
    console.log("Question:", question);

    if (!question || !answer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Question and answer are required.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are MIRA, an AI interviewer.

Evaluate the candidate's answer.

Candidate:
Name: ${candidateName}
Role: ${role}
Experience: ${experience}
Interview Type: ${interviewType}

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer using these five scores:

communication
relevance
structure
technicalDepth
score

Each score must be an integer from 1 to 10.

Definitions:

communication:
How clearly and confidently the candidate communicates.

relevance:
How directly the answer addresses the question.

structure:
How logically and clearly the answer is organized.

technicalDepth:
How technically accurate and detailed the answer is for the selected role.

score:
Overall quality of the answer.

Also provide:
- evaluation
- 3 strengths
- 3 improvements
- one relevant follow-up interview question

IMPORTANT:

Return ONLY a JSON object.

Do NOT use markdown.
Do NOT use code fences.
Do NOT write anything before the JSON.
Do NOT write anything after the JSON.

Use exactly this structure:

{
  "evaluation": "Brief professional evaluation",
  "communication": 7,
  "relevance": 7,
  "structure": 7,
  "technicalDepth": 7,
  "score": 7,
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "improvements": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],
  "followUpQuestion": "One relevant follow-up interview question"
}

All five scores must be integers between 1 and 10.
`;

    console.log("Sending request to OpenAI...");

    const response =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are MIRA. Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0,

        response_format: {
          type: "json_object",
        },
      });

    const content =
      response.choices?.[0]?.message?.content;

    console.log("RAW OPENAI RESPONSE:");

    console.log(content);

    if (
      !content ||
      typeof content !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MIRA returned an empty response.",
        },
        { status: 500 }
      );
    }

    let parsed;

    try {
      const jsonText =
        extractJson(content);

      console.log(
        "CLEANED JSON:"
      );

      console.log(jsonText);

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(
        "================================="
      );

      console.error(
        "MIRA JSON PARSE ERROR"
      );

      console.error(parseError);

      console.error(
        "RAW RESPONSE:"
      );

      console.error(content);

      console.error(
        "================================="
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "MIRA returned an invalid response. Please try again.",
          rawResponse: content,
        },
        { status: 500 }
      );
    }

    const result =
      normalizeResult(parsed);

    console.log(
      "FINAL MIRA RESULT:"
    );

    console.log(result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "================================="
    );

    console.error(
      "MIRA API ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "MIRA could not process the interview answer.",
      },
      { status: 500 }
    );
  }
}