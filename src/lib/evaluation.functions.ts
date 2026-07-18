import { createServerFn } from "@tanstack/react-start";
import { robustCallAI } from "./gemini-client";

const MODEL = "gemini-2.5-flash";

async function callAI(body: any) {
  return robustCallAI(body);
}

function parseJSON(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

// ---------------- Daily Quiz ----------------

export const generateDailyQuizAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { profile, dna, topic, skills } = data;

    const sys = `You are RaahAI's daily quiz generator. Create ONE short but sharp daily quiz (5 MCQs) tailored to the user's skill level. Difficulty must MATCH the user's DNA level — not too easy, not too hard.

Return STRICT JSON only:
{
  "title": string,
  "topic": string,
  "questions": [
    { "id": "q1", "question": string, "options": [string, string, string, string], "correct_index": number, "explanation": string }
  ]
}`;

    const user = `USER: ${profile?.full_name ?? "learner"} | Focus: ${profile?.current_focus ?? "n/a"} | Level: ${dna?.overall_level ?? "Explorer"}
DNA: Tech${dna?.technical_score ?? 0} Lead${dna?.leadership_score ?? 0} Net${dna?.networking_score ?? 0} Create${dna?.creativity_score ?? 0} Disc${dna?.discipline_score ?? 0}
TOPIC: ${topic}
SKILLS: ${(skills || []).join(", ") || "n/a"}
Generate 5 MCQs. Return JSON only.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    return parseJSON(res.choices?.[0]?.message?.content ?? "{}");
  });

// ---------------- Assignment ----------------

export const generateAssignmentAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { profile, dna, topic, skills } = data;

    const sys = `You are RaahAI's assignment designer. Create ONE practical assignment (not a toy) that the user can complete in 1-3 hours. It should reinforce today's learning and produce something reviewable (code snippet, written answer, mini-analysis, design). Difficulty must match user level.

Return STRICT JSON only:
{
  "title": string,
  "topic": string,
  "estimated_minutes": number,
  "instructions": string (markdown, clear steps),
  "deliverable": string (what to submit — text answer, github link, drive link, etc),
  "rubric": [ { "criterion": string, "weight": number } ]
}`;

    const user = `USER: ${profile?.full_name ?? "learner"} | Level: ${dna?.overall_level ?? "Explorer"}
DNA Tech:${dna?.technical_score ?? 0} Lead:${dna?.leadership_score ?? 0}
TOPIC: ${topic}
SKILLS: ${(skills || []).join(", ")}
Return JSON only.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    return parseJSON(res.choices?.[0]?.message?.content ?? "{}");
  });

// ---------------- Submit + Evaluate ----------------

export const evaluateSubmissionAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { profile, dna, evalTitle, instructions, rubric, submission, isProject } = data;

    const sys = `You are RaahAI's ${isProject ? "project" : "assignment"} evaluator. Be honest, specific, kind, and actionable. Score fairly based on rubric OR general software/growth quality if no rubric. Speak in warm Hinglish.

Return STRICT JSON only:
{
  "score": number (0-100),
  "summary": string (2-3 sentences),
  "strengths": string[],
  "improvements": string[],
  "next_steps": string[],
  "verdict": "excellent" | "good" | "needs_work"
}`;

    const userMsg = `USER LEVEL: ${dna?.overall_level ?? "Explorer"} | Focus: ${profile?.current_focus ?? "n/a"}
TITLE: ${evalTitle}
INSTRUCTIONS/BRIEF: ${typeof instructions === "string" ? instructions : JSON.stringify(instructions)}
RUBRIC: ${JSON.stringify(rubric || [])}

SUBMISSION:
Text/description: ${submission.text || "(none)"}
Link: ${submission.link || "(none)"}
Video: ${submission.videoUrl || "(none)"}

Note: You cannot open links directly. Judge based on the user's description of what they built and the plausibility/depth of their explanation. If description is too thin, mark as needs_work and ask for more detail in improvements.

Return JSON only.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });
    return parseJSON(res.choices?.[0]?.message?.content ?? "{}");
  });
