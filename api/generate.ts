import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, existingCode, model } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const systemPrompt = `You are a world-class Senior Frontend Architect and UI/UX Designer.
  Your goal is to build high-converting, visually stunning, and perfectly responsive websites.
  
  Follow these engineering and design principles:
  1. Structure: Use semantic, clean HTML5.
  2. Styling: Use Tailwind CSS utility classes exclusively. Implement a refined, modern aesthetic with a cohesive, professional color palette, elegant typography, and consistent spacing rhythm (use generous whitespace for a premium feel).
  3. Responsiveness: Ensure the site is fully mobile-first and works perfectly on all devices.
  4. Icons: Use Lucide React icons for all iconography.
  5. Components: Build modular, reusable-looking components.
  6. Interaction: Include subtle hover effects, smooth transitions, and clear call-to-action elements.
  7. Code quality: Write clean, commented, and highly maintainable code.
  8. Output ONLY the raw HTML and Tailwind CSS code.
  9. Do NOT include markdown code blocks (no \`\`\`html), do not explain, and do not add conversational text. 
  10. The output must be ready-to-use in an iframe.`;

  try {
    if (!prompt) {
        throw new Error("Prompt is required");
    }

    let code = "";
    if (model === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: existingCode ? `Existing code: ${existingCode}\nFollow-up: ${prompt}` : prompt }
        ],
      });
      code = response.choices[0].message.content || "";
    } else {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "",
      });
      if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not defined");
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: existingCode ? `Existing code: ${existingCode}\nFollow-up: ${prompt}` : prompt,
        config: {
            systemInstruction: systemPrompt
        }
      });
      code = response.text || "";
    }

    // Remove markdown code blocks if any (fallback)
    code = code.replace(/```html\n?|```/g, "").trim();

    res.status(200).json({ code });
  } catch (error) {
    console.error("Generation error details:", {
        message: error instanceof Error ? error.message : String(error),
        model,
        prompt: prompt.substring(0, 50) + "..."
    });
    res.status(500).json({ error: "Failed to generate website" });
  }
}
