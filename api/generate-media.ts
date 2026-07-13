import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import { checkUserCredits, decrementUserCredits, logGenerationEvent } from '../src/utils/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, type, userId, email } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const mediaType = type || 'image';

  // SaaS credit check before hitting fal.ai/gemini routes
  if (userId) {
    const creditCheck = await checkUserCredits(userId, email);
    if (!creditCheck.allowed && !creditCheck.profile.table_missing) {
      return res.status(402).json({ error: creditCheck.error || "Insufficient media/OpenAI credits. Please upgrade." });
    }
  }

  try {
    if (mediaType === 'image') {
      let imageUrl = "";
      let source = "pollinations-edge";

      // 1. Try premium Gemini API if key is present
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: {
              parts: [{ text: `${prompt} - professional high-quality UI asset, beautiful design, clean aesthetics` }]
            }
          });

          // Look for inlineData in candidates
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageUrl = `data:${mime};base64,${part.inlineData.data}`;
              source = 'gemini-premium';
              break;
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini Image generation failed, falling back to edge render:", geminiErr);
        }
      }

      // If premium failed or wasn't available, fallback to edge
      if (!imageUrl) {
        const safePrompt = encodeURIComponent(prompt.trim());
        imageUrl = `https://pollinations.ai/p/${safePrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      }

      // Decrement credits and log event if successful
      if (userId) {
        await logGenerationEvent(userId, 'image', prompt, imageUrl);
        await decrementUserCredits(userId);
      }

      return res.status(200).json({
        url: imageUrl,
        source,
        type: 'image'
      });
    } else {
      // AI Video Hero Banners fallback router
      const lowerPrompt = prompt.toLowerCase();
      let videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-motion-of-glowing-particles-32943-large.mp4"; // Default abstract particles
      let theme = "abstract-particles";

      if (lowerPrompt.includes('tech') || lowerPrompt.includes('code') || lowerPrompt.includes('ai') || lowerPrompt.includes('software')) {
        videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-numbers-31948-large.mp4";
        theme = "digital-tech";
      } else if (lowerPrompt.includes('neon') || lowerPrompt.includes('game') || lowerPrompt.includes('cyber') || lowerPrompt.includes('synth')) {
        videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32121-large.mp4";
        theme = "neon-laser";
      } else if (lowerPrompt.includes('crypto') || lowerPrompt.includes('bank') || lowerPrompt.includes('finance') || lowerPrompt.includes('business')) {
        videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-co-working-space-with-people-working-40251-large.mp4";
        theme = "business-workspace";
      } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('ocean') || lowerPrompt.includes('beach') || lowerPrompt.includes('relax')) {
        videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-beach-43105-large.mp4";
        theme = "nature-ocean";
      } else if (lowerPrompt.includes('space') || lowerPrompt.includes('star') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('cosmos')) {
        videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-42281-large.mp4";
        theme = "space-neon";
      }

      // Decrement credits and log event if successful
      if (userId) {
        await logGenerationEvent(userId, 'video', prompt, videoUrl);
        await decrementUserCredits(userId);
      }

      return res.status(200).json({
        url: videoUrl,
        source: 'mixkit-premium-cdn',
        type: 'video',
        theme
      });
    }
  } catch (error) {
    console.error("Media generation error:", error);
    res.status(500).json({ error: "Failed to generate media asset" });
  }
}
