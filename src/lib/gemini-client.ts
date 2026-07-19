// Groq-powered AI client as requested by the user to avoid Gemini API issues
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function maskKey(key: string | undefined): string {
  if (!key) return "undefined";
  if (key.length <= 10) return "***";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function robustCallAI(body: any) {
  // Use environment variable for the Groq API key
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!key) {
    throw new Error("GROQ_API_KEY environment variable is not set.");
  }

  // Groq models to try (robust fallbacks)
  const models = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"];

  // Standardize message roles for OpenAI/Groq API compatibility
  const formattedMessages = body.messages.map((m: any) => {
    let role = m.role;
    if (role === "model") {
      role = "assistant";
    }
    return {
      role: role,
      content: m.content || "",
    };
  });

  const requestBody: any = {
    messages: formattedMessages,
    temperature: 0.2,
  };

  // Add JSON response format constraint if requested
  if (body.response_format?.type === "json_object") {
    requestBody.response_format = { type: "json_object" };
  }

  let lastError: any = null;

  // Try each model sequentially in case of rate limits or model availability issues
  for (let i = 0; i < models.length; i++) {
    const selectedModel = models[i];
    console.log(`[Groq AI] Attempt ${i + 1}/${models.length} with model: ${selectedModel}`);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestBody,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      console.log(
        `[Groq AI] Success! Output length: ${data.choices?.[0]?.message?.content?.length ?? 0}`,
      );

      return {
        choices: [
          {
            message: {
              content: data.choices?.[0]?.message?.content ?? "",
            },
          },
        ],
      };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Groq AI] Failed model ${selectedModel}: ${errMsg}`);
    }
  }

  console.error("All Groq AI models failed.", lastError);
  throw new Error(`Groq AI call failed: ${lastError?.message || String(lastError)}`);
}
