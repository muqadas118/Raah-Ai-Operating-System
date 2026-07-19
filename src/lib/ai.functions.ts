import { createServerFn } from "@tanstack/react-start";
import { robustCallAI } from "./gemini-client";

const MODEL = "gemini-2.5-flash";

async function callAI(body: any) {
  return robustCallAI(body);
}

// ---------------- Roadmap generation ----------------

export const generateRoadmapAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { assessment, dna, profile } = data;

    const systemPrompt = `You are RaahAI's roadmap architect. Given a user's Growth DNA assessment, produce a REAL, personalized 90-day growth roadmap.

STRICT RULES:
- Use ONLY real, well-known resources: real YouTube channel/video titles, real books (author names), real docs (MDN, official docs, freeCodeCamp, Coursera courses, etc). No made-up links or fake authors.
- Match difficulty to the user's current level from the assessment — do NOT recommend beginner content to intermediate users, or vice versa.
- Each milestone MUST have ONE portfolio-worthy project (not a toy). It should be resume/GitHub-ready and slightly stretch their current skills.
- 5 to 7 milestones total, ordered by dependency. Each ~10-18 days.
- THE ROADMAP MUST BE EXTREMELY DETAILED AND HIGHLY EDUCATIONAL. Do not write short sentences or generic bullets. Write full explanations of technical concepts inside the "why" and "project.description" and "checkpoints" fields.
- SPECIFICALLY INJECT DEEP DETAILED TEACHING:
  1. For Programming Languages: Detail which language (e.g., JavaScript/TypeScript, Python, etc.) to start with first, and explain basic syntax or core logic concepts (e.g. variables, functions, conditions).
  2. For Backends: Explain core concepts in depth (e.g., REST APIs, request/response cycle, routing, JSON formats, headers) and name exact libraries/frameworks (e.g., Express, FastAPI) and tools.
  3. For Databases: Explain relational vs non-relational database theory, primary/foreign keys, and include actual SQL query syntax examples (e.g., how to write a basic SELECT, INSERT, UPDATE query, and how to query multiple tables) directly in the checkpoints or description.
  4. For Frontends: Explain frontend concepts including React, components, props, what hooks are (useState, useEffect), state management (Zustand/Redux), how the virtual DOM works, and specific frontend build tools.
  5. Setup & Tools: Clearly state which IDE to use (e.g., VS Code or Cursor), how to install Node.js/Python, and essential shell/command line commands needed to initialize and run projects.
- Output STRICT JSON only, no prose, no markdown fences.

JSON schema:
{
  "title": string,
  "summary": string (2-3 sentences, motivating, in Hinglish/English mix ok),
  "milestones": [
    {
      "id": string,
      "title": string,
      "duration_days": number,
      "why": string (Deep, highly educational, personalized explanation of why this matters, defining core concepts),
      "skills": string[],
      "resources": [
        { "type": "youtube"|"book"|"doc"|"course"|"article", "title": string, "author_or_channel": string, "url": string (real URL if known, else empty string) }
      ],
      "project": {
        "title": string,
        "description": string (Extremely detailed description, listing exactly how to start, setup, structure files, and use dependencies),
        "deliverables": string[] (Step-by-step specific deliverables),
        "tech_stack": string[],
        "portfolio_pitch": string (one line the user can put on resume/LinkedIn)
      },
      "checkpoints": string[] (An array of 4-6 detailed educational checkpoints. Each checkpoint should contain concrete tasks, exact commands to run, IDE recommendations, or actual code snippets/SQL queries)
    }
  ]
}`;

    const userPrompt = `USER PROFILE:
Name: ${profile?.full_name ?? "User"}
Current focus: ${profile?.current_focus ?? "n/a"}
Bio: ${profile?.bio ?? "n/a"}

GROWTH DNA SCORES (0-100):
Technical: ${dna?.technical_score ?? 0}
Leadership: ${dna?.leadership_score ?? 0}
Networking: ${dna?.networking_score ?? 0}
Creativity: ${dna?.creativity_score ?? 0}
Discipline: ${dna?.discipline_score ?? 0}
Overall level: ${dna?.overall_level ?? "Explorer"}

FULL ASSESSMENT ANSWERS:
${JSON.stringify(assessment?.answers || {}, null, 2)}

Generate the roadmap now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { title: "Roadmap", summary: "", milestones: [] };
    }

    return parsed;
  });



// ---------------- Raahbar chat ----------------

export const chatWithRaahbarAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { message, dna, profile, assessments, projects, roadmap, history } = data;

    // AI will adapt to both English and Roman Urdu based on the user's input
    const systemPrompt = `You are Raahbar — the user's personal AI growth mentor inside RaahAI. 
DYNAMIC LANGUAGE RULE:
- If the user messages you in English, reply in warm, encouraging, and highly professional English.
- If the user messages you in Roman Urdu (Urdu written in Latin alphabets) or a mix of Urdu & English (Hinglish), reply in warm, supportive Roman Urdu.
- Keep replies concise (3-6 sentences unless asked to go deep). Reference the user's Growth DNA, Roadmap, or Projects when relevant.

USER CONTEXT:
Name: ${profile?.full_name ?? "friend"}
Focus: ${profile?.current_focus ?? "not set"}
DNA Level: ${dna?.overall_level ?? "Explorer"}

ASSESSMENT HISTORY:
${JSON.stringify(assessments ?? [])}

CURRENT ROADMAP:
${JSON.stringify(roadmap ?? {})}

FORGED PROJECTS:
${JSON.stringify(projects ?? [])}

Give actionable, specific advice — never generic.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const res = await callAI({ model: MODEL, messages });
    const reply: string = res.choices?.[0]?.message?.content ?? "Sorry, something went wrong.";

    return { reply };
  });
// ---------------- Project Forge ----------------

export const forgeProjectsAI = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown>) => d)
  .handler(async ({ data }) => {
    const { dna, profile } = data as {
      dna: Record<string, unknown>;
      profile: Record<string, unknown>;
    };

    const systemPrompt = `You are RaahAI's Project Forge Master. Your job is to forge advanced, elite, production-grade project recommendations that are highly tailored to the user's current Growth DNA.
These must be SOLID, extremely advanced software engineering projects that would make top-tier tech companies (like Google, Stripe, or Netflix) immediately want to hire the user.
Do not suggest generic, basic projects like "Todo app" or "simple chat room". Suggest highly technical, system-level or complex full-stack projects.

STRICT RULES:
- Suggest exactly 3 solid, production-grade projects.
- Tailor them based on the user's current focus, bio, and Growth DNA scores.
- Each project must contain a "Google-Grade Pitch" (explaining exactly why a top-tier recruiter/architect would be impressed, referencing system complexity, low-latency, or scale).
- Include 2 powerful resume bullet points written in the Google X-Y-Z formula format ("Accomplished [X] as measured by [Y], by doing [Z]").
- Output STRICT JSON only, no prose, no markdown fences.

JSON schema:
{
  "projects": [
    {
      "id": string,
      "title": string,
      "tagline": string,
      "difficulty": "Advanced" | "Expert",
      "google_grade_reason": string,
      "architecture": string,
      "tech_stack": string[],
      "key_features": string[],
      "core_challenges": [
        { "challenge": string, "solution": string }
      ],
      "milestones": [
        { "week": "Week 1" | "Week 2" | "Week 3" | "Week 4", "goals": string[] }
      ],
      "resume_bullet_points": string[]
    }
  ]
}`;

    const userPrompt = `USER PROFILE:
Name: ${profile?.full_name ?? "User"}
Current focus: ${profile?.current_focus ?? "n/a"}
Bio: ${profile?.bio ?? "n/a"}

GROWTH DNA SCORES (0-100):
Technical: ${dna?.technical_score ?? 0}
Leadership: ${dna?.leadership_score ?? 0}
Networking: ${dna?.networking_score ?? 0}
Creativity: ${dna?.creativity_score ?? 0}
Discipline: ${dna?.discipline_score ?? 0}
Overall level: ${dna?.overall_level ?? "Explorer"}

Forge the advanced, job-winning portfolio projects now. Return ONLY the JSON object matching the schema.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { projects: [] };
    }

    if (!parsed || typeof parsed !== "object") {
      parsed = { projects: [] };
    }

    // Handle case where JSON is an array of projects directly
    if (Array.isArray(parsed)) {
      parsed = { projects: parsed };
    }

    // Handle case where key is not "projects" but similar
    if (!parsed.projects && Object.keys(parsed).length > 0) {
      const keys = Object.keys(parsed);
      const firstVal = parsed[keys[0]];
      if (Array.isArray(firstVal)) {
        parsed.projects = firstVal;
      } else {
        parsed.projects = [parsed];
      }
    }

    if (!Array.isArray(parsed.projects)) {
      parsed.projects = [];
    }

    // Assign IDs and ensure all required fields are populated if missing
    parsed.projects = parsed.projects.map((p: any, idx: number) => ({
      id: p.id || `project_${idx + 1}`,
      title: p.title || `Forged Project ${idx + 1}`,
      tagline: p.tagline || "Elite-tech architecture blueprint",
      difficulty: p.difficulty || "Advanced",
      google_grade_reason: p.google_grade_reason || "Scalable low-latency design",
      architecture: p.architecture || "Modular Clean Architecture",
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : ["TypeScript", "Node.js", "Docker"],
      key_features: Array.isArray(p.key_features)
        ? p.key_features
        : ["High performance", "Durable architecture"],
      core_challenges: Array.isArray(p.core_challenges) ? p.core_challenges : [],
      milestones: Array.isArray(p.milestones) ? p.milestones : [],
      resume_bullet_points: Array.isArray(p.resume_bullet_points) ? p.resume_bullet_points : [],
    }));

    return parsed;
  });

// ---------------- Daily 1-Hour Learning Missions ----------------

export const generateDailyMissionAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { roadmap, dayNumber, dna, profile } = data;

    const systemPrompt = `You are RaahAI's Daily Learning Coach. Your job is to generate a highly detailed, extremely practical, and beginner-friendly 1-hour learning mission for the user.
This mission MUST be directly aligned with Day ${dayNumber} of their current active growth roadmap: "${roadmap?.title || "My Growth Journey"}".

STRICT RULES:
- Break down the 60 minutes precisely. Present an exact time-by-time plan (e.g. 0-15 mins, 15-30 mins, etc.).
- Give clear, concrete step-by-step tasks. Keep them simple, practical, and highly educational for an absolute beginner level.
- Tell them EXACTLY which tools to open, which IDE to use (e.g. VS Code, Cursor), how to setup their environment (installing Node.js, setting up a package.json, or using a basic folder), and what console commands to run.
- Include a simple "Interactive Task" they can try on their local machine right now.
- Provide a multiple-choice "Quick Quiz" with 4 options, a correct answer index, and a helpful explanation to test their learning.
- Write in a warm, encouraging, friendly English. Maintain a professional yet accessible tone.
- Output STRICT JSON only, no prose, no markdown fences.

JSON schema:
{
  "day": ${dayNumber},
  "title": string (A catchy title for this day's session),
  "focusTopic": string (Core topic of this 1-hour session),
  "ide_and_tools": {
    "recommended_ide": string (e.g., "VS Code" or "Cursor"),
    "required_tools": string[] (e.g., ["Node.js", "npm", "Terminal"]),
    "setup_steps": string[] (Step-by-step setup instructions, e.g., "1. Create a folder named 'my-first-app'", "2. Run 'npm init -y' in the terminal")
  },
  "time_breakdown": [
    {
      "duration_minutes": number,
      "activity": string (e.g., "IDE & Environment Setup"),
      "description": string (Brief explanation of what we are doing in this block),
      "step_by_step_instruction": string (Extremely detailed, easy-to-follow instructions with exact code/commands to write or click)
    }
  ],
  "tasks": [
    {
      "id": string (e.g. "task_1"),
      "title": string (Short title),
      "description": string (Detailed instruction of what they must do),
      "hint": string (Helpful hint or explanation)
    }
  ],
  "quiz": {
    "question": string (A conceptual multiple-choice question testing today's topic),
    "options": string[] (Exactly 4 choices),
    "correct_option_index": number (0-3 index),
    "explanation": string (A detailed explanation of why the correct option is right, in Hinglish)
  },
  "motivation_quote": string (A short, high-energy motivational quote in Hinglish/English to keep them hooked)
}`;

    const userPrompt = `USER FOCUS & LEVEL:
Focus: ${profile?.current_focus ?? "Full Stack Development"}
Current level: ${dna?.overall_level ?? "Explorer"}

ACTIVE ROADMAP:
Title: ${roadmap?.title}
Summary: ${roadmap?.summary}
Milestones: ${JSON.stringify(roadmap?.milestones || [], null, 2)}

Generate the Daily Learning Mission for DAY ${dayNumber} now. Make it highly educational, step-by-step, absolute-beginner-friendly, specifying tools/IDEs and providing exact commands. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    // Default structure fallback if any parsing is slightly incorrect
    if (!parsed.title) {
      parsed.title = `Day ${dayNumber}: Foundation & Practical Steps`;
    }
    if (!parsed.time_breakdown) {
      parsed.time_breakdown = [
        {
          duration_minutes: 15,
          activity: "IDE & Tool Setup",
          description: "Setting up Terminal and VS Code.",
          step_by_step_instruction:
            "Download and install VS Code and Node.js on your laptop. Open your terminal and verify the commands.",
        },
        {
          duration_minutes: 25,
          activity: "Core Practice",
          description: "Practicing the basic concepts of the topic.",
          step_by_step_instruction:
            "Open a new folder in VS Code, create a new file, and write simple console logs or functions and run them.",
        },
        {
          duration_minutes: 20,
          activity: "Mini Experiment & Quiz",
          description: "Modifying the concept learned today and checking the result.",
          step_by_step_instruction:
            "Edit the code, verify how the output changes, and complete the interactive quiz.",
        },
      ];
    }
    if (!parsed.tasks) {
      parsed.tasks = [
        {
          id: "task_1",
          title: "Install & Setup",
          description:
            "Install and launch the recommended IDE (VS Code) and create the file structures.",
          hint: "Download the official installer for your OS.",
        },
      ];
    }
    if (!parsed.quiz) {
      parsed.quiz = {
        question: "What command is used in the terminal to run Node.js code?",
        options: [
          "node filename.js",
          "npm run filename.js",
          "run filename.js",
          "execute filename.js",
        ],
        correct_option_index: 0,
        explanation:
          "Node.js uses the 'node <filename>' command to execute a file. 'npm run' is used to run scripts from package.json.",
      };
    }

    return parsed;
  });

// ---------------- Cold Outreach Generator ----------------

export const generateOutreachAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { targetRole, platform, tone, purpose, userBrief } = data;

    const systemPrompt = `You are RaahAI's Outreach Architect, an elite tech networking expert. Your job is to draft high-conversion, highly personalized, and extremely natural cold outreach messages.
Avoid generic, robotic templates. Write like a real human who is genuinely interested in the recipient's work.
If tone is Hinglish, blend Hindi/Urdu written in Roman letters with English, making it warm, respectful, yet highly professional and relatable.

Output a strict JSON object with this exact schema:
{
  "subject": "A compelling, high-open-rate subject line (empty if LinkedIn Note)",
  "connection_note": "A highly punchy LinkedIn personalized connection invite note (STRICTLY UNDER 300 CHARACTERS including spaces, ready to copy-paste)",
  "message_body": "The main outreach message. Extremely personalized, starting with a hook, stating value/reason, and a clear, low-friction Call to Action (CTA). Keep it concise, 150-250 words.",
  "follow_up_note": "A short, polite follow-up message to send if they don't reply in 4-5 days (under 100 words).",
  "networking_tip": "One expert tip on how to reach out to this specific role (e.g. engineering manager vs recruiter vs peer) successfully."
}`;

    const userPrompt = `TARGET DETAILS:
Recipient Role: ${targetRole}
Platform: ${platform}
Tone preferred: ${tone}
Outreach Purpose: ${purpose}
Sender Brief Details: ${userBrief || "A passionate learner looking for growth opportunities and advice."}

Generate the high-conversion outreach templates now. Ensure the connection_note is strictly under 300 characters. Return ONLY the JSON.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.message_body) {
      parsed = {
        subject: `Quick question regarding ${targetRole} roles`,
        connection_note:
          "Hi! Loved your recent posts/work in tech. Would love to connect and follow your journey here. Cheers!",
        message_body: `Hi there,\n\nHope you're doing great. I've been following your work and would love to ask a quick question about your journey into ${targetRole}. I'm currently practicing full-stack development and would highly value a 2-minute insight from someone with your experience.\n\nThanks, and looking forward to connecting!`,
        follow_up_note:
          "Hi, just following up in case this got buried in your inbox. No pressure at all, would love to connect whenever you are free!",
        networking_tip:
          "Engineers love talking about specific problems they've solved. Ask about a technical blog post or project they worked on!",
      };
    }

    return parsed;
  });

// ---------------- LinkedIn Profile Auditor & Optimizer ----------------

export const optimizeLinkedinAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { currentHeadline, currentAbout, currentExperience, techStack } = data;

    const systemPrompt = `You are RaahAI's LinkedIn Optimization Master. You build profiles that attract tech recruiters, engineering managers, and technical co-founders.
Your job is to audit the user's current LinkedIn profile elements and return a highly polished, recruiter-optimized, search-friendly version.

Output a strict JSON object with this exact schema:
{
  "headlines": [
    "Option 1: Action-oriented, result-focused headline (under 120 chars)",
    "Option 2: Tech-stack-focused, keyword-rich headline (under 120 chars)",
    "Option 3: Hybrid creative/builder headline (under 120 chars)"
  ],
  "about_rewrite": "A full, beautiful, high-impact rewrite of the 'About' section. Use a first-person storytelling approach, clearly stating passion, major tech skills, key projects, and what the user is open to. Format with clean spacing and bullet points for readability.",
  "experience_bullet_points": "Actionable instructions and formula (e.g. Accomplished X as measured by Y by doing Z) on how to re-write experience points to sound incredibly professional.",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "strategy": [
    "Specific networking/content strategy action step 1",
    "Specific networking/content strategy action step 2",
    "Specific networking/content strategy action step 3"
  ]
}`;

    const userPrompt = `USER PROFILE INFO:
Current Headline: ${currentHeadline || "Looking for opportunities"}
Current About: ${currentAbout || "N/A"}
Current Experience: ${currentExperience || "N/A"}
Tech Stack / Target Skills: ${techStack || "Software Development"}

Optimize this profile for high search discoverability and maximum conversion rate. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.headlines) {
      parsed = {
        headlines: [
          "Full Stack Developer | React, Node.js & TypeScript | Building scalable web apps",
          "Software Engineer in Training | MERN Stack | Actively building resume-worthy open-source projects",
          "Problem Solver & Tech Enthusiast | Python, SQL & Cloud | Passionate about Backend Architecture",
        ],
        about_rewrite:
          "I am a passionate software developer who loves building products from scratch. Currently diving deep into modern web architectures, databases, and clean code practices. I focus on writing clean, readable, and highly optimized code.\n\nKey skills: React, TypeScript, Node.js, Express, PostgreSQL, Firebase.\n\nLet's connect and talk tech, collaboration, or learning journeys!",
        experience_bullet_points:
          "Use the Google XYZ Formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Example: Optimized API load times by 40% (Y) by implementing Redis caching queries (Z) on user profiles (X).",
        seo_keywords: [
          "React Developer",
          "TypeScript",
          "Node.js Developer",
          "Software Engineer",
          "Full Stack Developer",
        ],
        strategy: [
          "Post weekly about your project build updates. Use high-quality screenshots and list the technical challenges you solved.",
          "Engage with 5 posts daily from engineering managers or tech leads by writing detailed, value-adding comments, not just 'nice post'.",
          "Send personalized connection requests referencing mutual interests, active tech stacks, or their recent shared technical articles.",
        ],
      };
    }

    return parsed;
  });

// ---------------- Brand Builder: AI-written LinkedIn / X posts ----------------
export const generateSocialPostsAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { progress, projectDetails, tone } = data;

    const systemPrompt = `You are an expert personal branding coach and developer advocate.
Given a user's recent progress/achievement, project details, and desired tone, write highly engaging and professional LinkedIn and Twitter/X posts.

STRICT RULES:
- LinkedIn Post: Format with a captivating hook line, clear value-driven body text (split with double linebreaks for readability), a bulleted list of key takeaways/learnings (use elegant characters like 🚀, 💡, 🛠️), and a call-to-action (no generic links, invite discussion). Use appropriate hashtags.
- X (Twitter) Post: Must be concise, punchy, and strictly within 280 characters. Use a strong hook, key highlight, and call to action.
- Content writing/positioning tip: Give one specific, highly customized piece of advice on how the user can capture attention with this specific progress.
- Keep the writing authentic. Avoid generic AI corporate buzzwords ("thrilled to announce", "humbled and excited", "game-changing", "revolutionary"). Write like a real, passionate builder.
- Hinglish is supported if the user requests it or writes details in Hinglish.
- Output STRICT JSON only.

JSON schema:
{
  "linkedin_post": string,
  "x_post": string,
  "tip": string
}`;

    const userPrompt = `PROGRESS / ACHIEVEMENT:
${progress || "No progress provided yet."}

PROJECT DETAILS:
${projectDetails || "No project specified."}

TONE STYLE:
${tone || "Professional, tech-savvy, authentic"}

Generate the social media posts now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.linkedin_post) {
      parsed = {
        linkedin_post: `🚀 Just reached a milestone! I've been working on a new project and successfully implemented the core API architecture.\n\nHere are my key takeaways:\n• Solved latency issues by implementing a lightweight caching layer.\n• Streamlined route structures for cleaner, more maintainable code.\n\nWhat are your thoughts on API optimization patterns? Let me know in the comments! 👇 #buildinpublic #webdev #tech`,
        x_post: `🚀 Milestone unlocked! Just optimized the core API architecture of my current project, resolving key latency issues with lightweight caching. Standardizing routes feels so satisfying. #buildinpublic #dev`,
        tip: "Focus on sharing the specific 'before and after' metrics in your next post to show concrete problem-solving.",
      };
    }

    return parsed;
  });

// ---------------- Brand Builder: Personal Bio + Tagline Generator ----------------
export const generateBioTaglineAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { skills, background, style } = data;

    const systemPrompt = `You are a professional personal branding copywriter specializing in developer profiles.
Given a user's technical skills, background, and visual style/vibe, generate:
1. Four distinct taglines/headlines (one punchy/minimalist, one technical/keyword-focused, one action-oriented, one conversational/creative). Each under 80 characters.
2. Short Bio: A compact bio (max 160 characters) perfect for Twitter, GitHub, or LinkedIn's mobile card.
3. About Section: A fully fleshed-out professional bio (2 paragraphs) for LinkedIn or a portfolio website.

STRICT RULES:
- Output should be clean, authentic, and free of typical robotic AI buzzwords ("passionate developer with 3 years of experience..."). Instead, make it sound human, unique, and value-driven.
- Output STRICT JSON only.

JSON schema:
{
  "taglines": {
    "minimalist": string,
    "technical": string,
    "action": string,
    "creative": string
  },
  "short_bio": string,
  "about_section": string
}`;

    const userPrompt = `SKILLS & EXPERTISE:
${skills || "Software development, coding"}

BACKGROUND & EXPERIENCE:
${background || "Self-taught builder, learning in public"}

VIBE STYLE:
${style || "Tech enthusiast, modern"}

Generate the bios and taglines now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.taglines) {
      parsed = {
        taglines: {
          minimalist: "Building lightweight solutions to complex problems.",
          technical: "Full-Stack Engineer specializing in React, TypeScript & Node.js.",
          action: "Turning ideas into high-performance web applications.",
          creative: "Chasing clean code and crafting seamless digital experiences.",
        },
        short_bio:
          "Full-Stack developer and open-source contributor. I build clean, high-performance web systems and share my learning journey in public. 💻🚀",
        about_section:
          "I am a full-stack software developer who loves taking digital products from concept to execution. My focus is on writing clean, readable code and designing robust, scalable architectures that provide excellent user experiences.\n\nWhether it's configuring robust backend endpoints or crafting smooth React user interfaces, I'm passionate about continuous learning and contributing to impact-driven projects. Let's collaborate or exchange ideas!",
      };
    }

    return parsed;
  });

// ---------------- Brand Builder: GitHub README Optimizer ----------------
export const generateReadmeOptimizerAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { title, description, features, techStack, installation } = data;

    const systemPrompt = `You are a principal developer advocate and master technical writer.
Given a project's title, description, features, tech stack, and installation steps, generate a professional-grade, beautifully structured GitHub README.md file.

STRICT RULES:
- Do not use generic markdown placeholders. Every section should be tailored precisely to the user's input.
- Structure to include:
  1. A visually stunning header with badges (Shields.io style) for technologies used, license, and PRs.
  2. A clear, compelling Project Overview with a "Problem Solved" sub-statement.
  3. A high-impact Features list (use unique emoji bullets, not standard hyphens).
  4. Tech Stack section represented cleanly.
  5. A gorgeous, structured ASCII Art or Text-based Architecture flow diagram to illustrate how data/logic moves.
  6. Detailed, step-by-step Quick Start / Installation Guide (with code blocks).
  7. Clear instructions on Contributing and License.
- Write in a highly technical, professional, yet welcoming tone.
- Output STRICT JSON only.

JSON schema:
{
  "readme_markdown": string,
  "optimization_tips": string[]
}`;

    const userPrompt = `PROJECT TITLE:
${title || "My Amazing Project"}

PROJECT DESCRIPTION:
${description || "A custom-built digital tool."}

KEY FEATURES:
${features || "List of main functionalities."}

TECH STACK:
${techStack || "React, TypeScript, CSS"}

INSTALLATION / SETUP:
${installation || "npm install, npm run dev"}

Generate the complete README.md content now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.readme_markdown) {
      parsed = {
        readme_markdown: `# ${title || "Project Title"}\n\nThis is a beautiful project...`,
        optimization_tips: [
          "Add a high-quality GIF or screenshot showing the actual working dashboard to increase GitHub stars.",
          "Set up automated GitHub actions to run lint and build on pull requests.",
        ],
      };
    }

    return parsed;
  });

// ---------------- Brand Builder: Content Calendar Suggestions ----------------
export const generateContentCalendarAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { topic, audience, frequency } = data;

    const systemPrompt = `You are a premium content strategist for technical creators and developers.
Given a target core topic, target audience, and weekly posting frequency, craft a highly tailored, strategic 7-day content calendar.

STRICT RULES:
- Each content idea MUST be highly specific, not generic placeholders. For instance, instead of "write about React", suggest "Write a breakdown of why useEffect cleanup functions fail, showing a memory-leak example".
- Each scheduled post in the calendar must contain:
  1. Day & Platform (LinkedIn, X, or both).
  2. Headline/Topic (highly clickable and technical).
  3. Copywriting Hook: A direct, attention-grabbing opening sentence.
  4. Core Message Outline: 3-4 bullet points detailing exactly what to write in the body.
  5. Action-oriented CTA: A specific question or instruction to drive comments.
  6. Estimated difficulty to write (Easy, Medium, Hard).
- Ensure a healthy mix of post types: code snippets/learnings, personal growth/storytelling, controversial technical opinions, and step-by-step tutorials.
- Output STRICT JSON only.

JSON schema:
{
  "strategy_overview": string,
  "calendar": [
    {
      "day": string,
      "platform": string,
      "topic": string,
      "hook": string,
      "body_outline": string[],
      "cta": string,
      "hashtags": string[],
      "difficulty": string
    }
  ]
}`;

    const userPrompt = `CORE TOPIC:
${topic || "Web Development & Software Engineering"}

TARGET AUDIENCE:
${audience || "Junior Developers, Tech Enthusiasts, Hiring Managers"}

WEEKLY FREQUENCY:
${frequency || "3 posts per week"}

Generate the content calendar now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.calendar) {
      parsed = {
        strategy_overview:
          "Focus on sharing deep, practical insights instead of standard high-level advice to stand out to intermediate-to-senior devs.",
        calendar: [
          {
            day: "Monday",
            platform: "LinkedIn / X",
            topic: "Solving a major bug",
            hook: "I spent 4 hours debugging what turned out to be a single line of config.",
            body_outline: [
              "Describe the initial symptom (e.g. infinite loops on render).",
              "Show the debugging methodology you used (console logs, browser profiling).",
              "Highlight the actual culprit and why it is a common gotcha.",
            ],
            cta: "What's the most elusive bug you've solved recently? Let's discuss in the comments!",
            hashtags: ["debugging", "webdev", "react"],
            difficulty: "Medium",
          },
        ],
      };
    }

    return parsed;
  });

// ---------------- Brand Builder: Growth-Story Narrative Builder ----------------
export const generateGrowthStoryAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { background, hurdle, turningPoint, currentResult } = data;

    const systemPrompt = `You are a master biographer and creative non-fiction writer specializing in high-impact tech narratives.
Given a user's background, a major hurdle they faced, a key turning point, and their current successful outcome, craft a spellbinding "Growth Story" narrative.

STRICT RULES:
- Use a storytelling structure: setup, conflict, climax, resolution, and core lesson.
- Create 3 alternative narrative options:
  1. The "Hero's Journey" style: highly cinematic, dramatic, and emotional.
  2. The "Raw & Authentic" style: direct, transparent about failures, humble, and inspiring.
  3. The "Key Takeaways" style: value-first, ideal for readers who want quick insights.
- Avoid clichés and over-hyped buzzwords. Focus on specific human emotions, clear technical milestones, and genuine self-reflection.
- Output STRICT JSON only.

JSON schema:
{
  "narratives": {
    "heroes_journey": string,
    "raw_authentic": string,
    "key_takeaways": string
  },
  "narrative_advice": string
}`;

    const userPrompt = `USER BACKGROUND:
${background || "Self-taught developer starting from scratch."}

MAJOR HURDLE / CHALLENGE:
${hurdle || "Struggling with impostor syndrome and complex data structures."}

KEY TURNING POINT:
${turningPoint || "Built a full-stack project from scratch and finally understood async states."}

CURRENT SUCCESS / RESULT:
${currentResult || "Ready to apply for jobs with a strong, resume-ready portfolio."}

Generate the growth story narratives now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.narratives) {
      parsed = {
        narratives: {
          heroes_journey:
            "From zero to building full-stack applications. It started with simple tutorials...",
          raw_authentic:
            "Let's be honest: learning in public is tough. I used to doubt my coding logic every single day...",
          key_takeaways:
            "3 things I learned going from a self-taught enthusiast to a portfolio-ready developer...",
        },
        narrative_advice:
          "Share this when launching your main project. Tag people who helped you along the way.",
      };
    }

    return parsed;
  });

export const generateApplySummaryAI = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    const { dna, profile, answers, opportunity } = data;

    const systemPrompt = `You are RaahAI's Career Scout & Application Coach. Your job is to generate a custom, high-impact application package summary for a user applying to a specific opportunity.
    
Write in a warm, encouraging, professional and highly motivating Hinglish (Urdu/Hindi written in Latin script mixed with English).
Include four main sections:
1. **Google-Grade Cover Pitch / Note**: A highly persuasive cover letter/note (e.g. for LinkedIn outreach or cold email or application portal) highlighting how their skills match this specific opportunity. Mention their actual Growth DNA axis strengths if relevant.
2. **Resume Customization Advice**: Specific bullets or keywords to highlight in their resume for this role.
3. **Documents Checklist & Steps**: Complete step-by-step checklist of documents they must prepare, specifically highlighting any missing prerequisites.
4. **Interview Secret Weapon**: A unique strategy/project idea to talk about that will blow the interviewers away.

Output STRICT JSON only, with no markdown fences, no formatting outside of JSON.

JSON schema:
{
  "cover_pitch": string,
  "resume_tips": string[],
  "required_docs": string[],
  "interview_secret": string
}`;

    const userPrompt = `USER PROFILE:
Name: ${profile?.full_name ?? "User"}
Current status: ${answers?.status ?? "Student"}
Education: ${answers?.education ?? "Not specified"}
Field: ${answers?.field ?? "Not specified"}
Primary Stack: ${answers?.primary_stack ?? "Not specified"}
Skills: ${JSON.stringify(answers?.tech_skills || [])}

OPPORTUNITY DETAILS:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Type: ${opportunity.type} (Scholarship / Internship / Job / Hackathon / Government Scheme)
Description: ${opportunity.description}
Website: ${opportunity.website}

Generate the custom apply-ready summary now. Return ONLY the JSON object.`;

    const res = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content: string = res.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.cover_pitch) {
      parsed = {
        cover_pitch: "Preparing the pitch for you...",
        resume_tips: [
          "Highlight React, Node.js and systems architecture.",
          "Showcase your portfolio project from Roadmap.",
        ],
        required_docs: ["Resume (PDF)", "Transcript", "CNIC/Passport"],
        interview_secret: "Solve a real world problem and pitch it!",
      };
    }

    return parsed;
  });

// ---------------- Resume Tailoring ----------------
export const tailorResumeAI = createServerFn({ method: "POST" })
  .validator(
    (d: {
      profile: any;
      projects: any;
      opportunity: string;
      uploadedCVText?: string;
      refinementInstruction?: string;
      previousResume?: any;
    }) => d,
  )
  .handler(async ({ data }) => {
    const {
      profile,
      projects,
      opportunity,
      uploadedCVText,
      refinementInstruction,
      previousResume,
    } = data;

    let systemPrompt = "";
    if (refinementInstruction && previousResume) {
      systemPrompt = `You are an expert career coach and ATS optimization specialist.
Your task is to REFINE and UPDATE an existing tailored resume based on the user's specific instruction.

Opportunity Description:
${opportunity}

Previous Generated Resume:
${JSON.stringify(previousResume)}

User Refinement Instruction:
"${refinementInstruction}"

Rules:
1. Keep the previous resume structure, but make the requested changes/updates carefully.
2. Maintain high ATS optimization (score 0-100). If the change affects the ATS score (e.g., adding relevant keywords), update the atsScore and atsFeedback accordingly.
3. Keep the tone professional, confident, and persuasive.
4. Return the response STRICTLY as a JSON object with this exact structure (no markdown fences, just the JSON string):
{
  "atsScore": number,
  "atsFeedback": string[],
  "summary": "Updated professional summary",
  "experienceAndProjects": [
    {
      "title": "Project or Job Name",
      "description": "Updated tailored description"
    }
  ],
  "skills": ["List", "of", "updated", "skills"]
}`;
    } else {
      systemPrompt = `You are an expert career coach and ATS optimization specialist. 
Your task is to tailor a user's resume/CV to a specific opportunity (Job Description, Scholarship, etc.) provided by the user.

Input provided:
1. User Profile: ${JSON.stringify(profile)}
2. User Projects: ${JSON.stringify(projects)}
3. Opportunity Description: ${opportunity}
${uploadedCVText ? `4. Existing Uploaded CV Content: ${uploadedCVText}` : ""}

Rules:
1. Optimize for ATS (Applicant Tracking System). Use keywords from the opportunity description.
2. Select and highlight the most relevant projects from their portfolio. If they uploaded an existing CV, incorporate and prioritize details/experience from their uploaded CV as well.
3. Keep the tone professional, confident, and persuasive.
4. Calculate a projected ATS score (0-100) and explain why, with improvement suggestions.

Return the response STRICTLY as a JSON object with this exact structure (no markdown fences, just the JSON string):
{
  "atsScore": 85,
  "atsFeedback": ["Keyword match for React", "Missing backend terms"],
  "summary": "Professional summary optimized for the job.",
  "experienceAndProjects": [
    {
      "title": "Project Name",
      "description": "Tailored description using STAR method (Situation, Task, Action, Result)"
    }
  ],
  "skills": ["List", "of", "tailored", "skills"]
}`;
    }

    const res = await callAI({
      model: MODEL,
      messages: [{ role: "user", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    try {
      const parsed = JSON.parse(res.choices[0].message.content);
      return parsed;
    } catch (e) {
      console.error("Failed to parse resume JSON");
      throw new Error("AI returned invalid JSON.");
    }
  });

export const generateOpportunitiesAI = createServerFn({ method: "POST" })
  .validator((data: { userProfile: any; dna: any; educations?: any; experiences?: any }) => data)
  .handler(async ({ data }) => {
    try {
      const { userProfile, dna, educations = [], experiences = [] } = data;

      const systemPrompt = `You are a world-class career and education matching AI.
Your task is to generate highly specific, active real-world or highly realistic opportunities for a candidate.

CRITICAL DEADLINE RULES:
- The current date is July 18, 2026.
- Under NO circumstances should any opportunity have an expired deadline.
- All deadlines MUST be in the future (e.g., August 2026, September 2026, or anytime in late 2026/2027).
- If an opportunity has no fixed deadline, set the deadline field to "Rolling", "Open", or "Currently Active".
- NEVER generate a deadline date in the past (e.g., 2024, 2025, or early 2026).

LOCAL & REGIONAL SCHEMES RULES:
- For "schemes" (Government/Private Schemes or Fellowships), you MUST include a mixture of prominent regional/local schemes and global schemes.
- Specifically include well-known active schemes for South Asian/Pakistani candidates (such as the Prime Minister Youth Program / Laptop Scheme, NAVTTC National Free IT Training Courses, HEC National Scholarships, National Freelance Training Program, PEEF, or local tech bootcamps and fellowships) that are currently active and running.

Candidate Profile:
Name: ${userProfile?.full_name || "Unknown"}
Bio/Focus: ${userProfile?.bio || ""} ${userProfile?.current_focus || ""}
Education History: ${JSON.stringify(educations)}
Work/Project Experience: ${JSON.stringify(experiences)}
DNA Scores: Tech (${dna?.technical_score}), Creativity (${dna?.creativity_score}), Discipline (${dna?.discipline_score})
Overall Level: ${dna?.overall_level || "Beginner"}

Generate exactly:
- 10 Worldwide/Local Scholarships (with future/active deadlines)
- 10 Global/Local Internships (with future/active deadlines)
- 10 Certificates (Free/Paid mix, currently open)
- 10 Hackathons (Local & International, with future/active deadlines)
- 10 Government/Private Schemes or Fellowships (incorporating local/national active schemes like PM Youth Program, NAVTTC, HEC, regional fellowships, alongside global programs)
that perfectly match this candidate's skill level and domain.

Ensure the matchReason explicitly explains WHY this matches their specific education, skill level, or DNA score.

Return a valid JSON object matching this schema EXACTLY (where each array must contain exactly 10 items):
{
  "scholarships": [
    { "id": "s1", "title": "...", "provider": "...", "type": "Scholarship", "deadline": "...", "location": "...", "prizesOrValue": "...", "website": "...", "description": "...", "requiredDocs": ["...", "..."], "applySteps": ["...", "..."], "matchReason": "..." }
  ],
  "internships": [
    { "id": "i1", "title": "...", "provider": "...", "type": "Internship", "deadline": "...", "location": "...", "prizesOrValue": "...", "website": "...", "description": "...", "requiredDocs": ["..."], "applySteps": ["..."], "matchReason": "..." }
  ],
  "certificates": [
    { "id": "c1", "title": "...", "provider": "...", "type": "Certificate", "isPaid": true, "location": "Online", "prizesOrValue": "...", "website": "...", "description": "...", "requiredDocs": [], "applySteps": ["..."], "matchReason": "..." }
  ],
  "hackathons": [
    { "id": "h1", "title": "...", "provider": "...", "type": "Hackathon", "deadline": "...", "location": "...", "prizesOrValue": "...", "website": "...", "description": "...", "requiredDocs": [], "applySteps": ["..."], "matchReason": "..." }
  ],
  "schemes": [
    { "id": "sc1", "title": "...", "provider": "...", "type": "Scheme", "deadline": "...", "location": "...", "prizesOrValue": "...", "website": "...", "description": "...", "requiredDocs": ["..."], "applySteps": ["..."], "matchReason": "..." }
  ]
}
`;

      const res = await callAI({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: "Generate global opportunities, hackathons, and schemes matching my profile.",
          },
        ],
        response_format: { type: "json_object" },
      });
      const content: string = res.choices?.[0]?.message?.content ?? "{}";
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match
          ? JSON.parse(match[0])
          : { scholarships: [], internships: [], certificates: [], hackathons: [], schemes: [] };
      }
      return parsed;
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });

// ---------------- Leadership Development Agent Functions ----------------

export const evaluateLeadershipStyleAI = createServerFn({ method: "POST" })
  .validator((d: { answers: Record<string, string> }) => d)
  .handler(async ({ data }) => {
    try {
      const { answers } = data;
      const systemPrompt = `You are the Lead Mentor at RaahAI Leadership Academy. Given a student's responses to leadership situational questions, determine their core Leadership Style.
      
Possible leadership styles to match:
- "Servant Leader" (empathy, support, lifting others first, selfless service like Edhi)
- "Visionary Leader" (strategic foresight, bold dreams, inspiring hope, historic mobilization like Quaid-e-Azam)
- "Strategic Architect" (systems thinking, planning, optimizing resources, scaling through processes)
- "Grassroots Activist" (direct community mobilization, local action, immediate hands-on relief, driving awareness)

Your task is to analyze their situational choices and return a structured JSON response describing:
1. style: One of the 4 categories above.
2. title: An inspiring, high-impact localized title (e.g. "Community Mobilization Alchemist", "Strategic Change Catalyst").
3. description: A deep, empowering 3-4 sentence analysis explaining why this represents their superpower and how it can empower local Pakistani communities.
4. famousPakistaniExamples: An array of 2 real-world Pakistani exemplars of this style (with a brief sentence explaining their work/legacy).
5. coreStrengths: 3 main leadership strengths they have.
6. growthAreas: 2 areas where they can improve to become a holistic global leader.

Return ONLY a valid JSON object matching this schema EXACTLY:
{
  "style": string,
  "title": string,
  "description": string,
  "famousPakistaniExamples": [
    { "name": string, "legacy": string }
  ],
  "coreStrengths": string[],
  "growthAreas": string[]
}`;

      const res = await callAI({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here are my situational leadership responses: ${JSON.stringify(answers)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });

export const simulateLeadershipScenarioAI = createServerFn({ method: "POST" })
  .validator(
    (d: {
      scenarioId: string;
      scenarioTitle: string;
      scenarioDescription: string;
      userResponse: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const { scenarioId, scenarioTitle, scenarioDescription, userResponse } = data;

      const systemPrompt = `You are a collaborative board of 3 elite AI Leadership Mentors evaluating a Pakistani student's response to a critical community-impact leadership crisis.
      
Scenario context:
Title: ${scenarioTitle}
Situation: ${scenarioDescription}

Student's Proposed Response:
"${userResponse}"

You must simulate a collaborative evaluation by 3 distinct mentors:
1. Mentor "Chaudhary Nabeel" (Grassroots Organizer - evaluates empathy, trust-building, community buy-in, and raw grassroots mobilization).
2. Mentor "Dr. Amina" (Strategic Planner - evaluates logistics, resource constraints, feasibility, formal permits, and scalable processes).
3. Mentor "Allama Iqbal Mentor" (Visionary Coach - evaluates confidence, inspiration, strategic storytelling, alignment with higher purpose, and motivational tone).

Your task is to return a detailed evaluation JSON containing:
1. mentors: An object containing grades (0-100) and specific, constructive feedback from each mentor in their unique persona/voice.
2. overallAnalysis: A clear analysis of what was excellent and what was missing in their strategy.
3. recommendedActionPlan: 3 immediate tactical next steps to execute this scenario perfectly.
4. optimizedResponse: A beautifully re-written, highly persuasive, and assertive expert version of how a premium global leader would articulate their decision and action.

Return ONLY a valid JSON object matching this schema:
{
  "mentors": {
    "grassroots": { "grade": number, "feedback": string },
    "strategic": { "grade": number, "feedback": string },
    "visionary": { "grade": number, "feedback": string }
  },
  "overallAnalysis": string,
  "recommendedActionPlan": string[],
  "optimizedResponse": string
}`;

      const res = await callAI({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Evaluate my proposal for this scenario crisis." },
        ],
        response_format: { type: "json_object" },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });

export const planSocialImpactProjectAI = createServerFn({ method: "POST" })
  .validator((d: { idea: string; category: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { idea, category } = data;

      const systemPrompt = `You are RaahAI's Senior Social Impact Project Planner. 
Your task is to create a complete, highly localized, and actionable step-by-step Social Impact Project Plan based on the student's project idea: "${idea}" (Category: ${category}).

Make the plan extremely realistic for Pakistani settings (colleges, neighborhoods, cities, rural areas). Detail local strategies like WhatsApp mobilizations, talking to Union Council chairmans, contacting specific local non-profits, or dealing with local electricity/internet challenges.

Your output must be structured exactly in JSON:
{
  "projectTitle": string,
  "tagline": string,
  "objective": string,
  "phases": [
    {
      "phaseName": string,
      "duration": string,
      "description": string,
      "actionItems": string[]
    }
  ],
  "localTactics": string[],
  "partnersToSeek": string[],
  "sustainabilityPlan": string,
  "impactKPIs": string[]
}

Return ONLY valid JSON.`;

      const res = await callAI({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Plan my project." },
        ],
        response_format: { type: "json_object" },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });
