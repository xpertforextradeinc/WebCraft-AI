import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for generating website code
  app.post("/api/generate", async (req, res) => {
    const { prompt, existingCode, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemPrompt = "You are a web developer. Output ONLY valid, clean HTML/Tailwind CSS code for the requested website. Do not include markdown code blocks, do not explain, do not add conversational text. The entire response must be just the HTML code.";

    try {
      let code = "";
      if (model === "openai") {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: existingCode ? `Existing code: ${existingCode}\nFollow-up: ${prompt}` : prompt }
          ],
        });
        code = response.choices[0].message.content || "";
      } else {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY!,
        });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `${systemPrompt}\n\n${existingCode ? `Existing code: ${existingCode}\nFollow-up: ${prompt}` : prompt}`,
        });
        code = response.text() || "";
      }

      // Remove markdown code blocks if any (fallback)
      code = code.replace(/```html\n?|```/g, "").trim();

      res.json({ code });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ error: "Failed to generate website" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
