import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { checkUserCredits, decrementUserCredits, logGenerationEvent } from '../src/utils/supabaseServer';
import { syndicateToTelegram } from './utils/telegram';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, existingCode, model, userId, email, includeAuth } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Credit check logic for OpenAI Model (SaaS upgrade controls)
  if (model === "openai" && userId) {
    const creditCheck = await checkUserCredits(userId, email);
    if (!creditCheck.allowed && !creditCheck.profile.table_missing) {
      return res.status(402).json({ error: creditCheck.error || "Insufficient media/OpenAI credits. Please upgrade." });
    }
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
  10. The output must be ready-to-use in an iframe.
  11. Include a <script> tag at the end of the <body> that attaches a click event listener to the document. When an <a> or <button> is clicked, post a message to the parent window: window.parent.postMessage({ type: 'analytics_click', target: event.target.tagName, text: event.target.innerText || event.target.textContent }, '*');
  12. ALSO, include the following Smartsupp Live Chat script at the end of the <body>:
  <script type="text/javascript">
  var _smartsupp = _smartsupp || {};
  _smartsupp.key = 'c6bc1067a003eba2c1ba3bcaa67b6f806658a486';
  window.smartsupp||(function(d) {
    var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
    s=d.getElementsByTagName('script')[0];c=d.createElement('script');
    c.type='text/javascript';c.charset='utf-8';c.async=true;
    c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
  })(document);
  </script>
  <noscript>Powered by <a href="https://www.smartsupp.com" target="_blank">Smartsupp</a></noscript>`;

  let finalSystemPrompt = systemPrompt;
  if (includeAuth) {
    const host = req.headers.host || 'ais-dev-6eos3azabtauqxmgzshqjz-571192572309.europe-west1.run.app';
    const siteId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    
    finalSystemPrompt += `

CRITICAL REQUIREMENT - INCLUDE WORKING USER AUTH (AUTH STARTER KIT):
The user wants this generated website to include a working signup/login system backed by our existing Supabase database.
You MUST embed a premium, visually stunning, fully functional user account management UI and backend integration into the generated HTML.
Obey these rules:
1. Navigation Controls & Logged In Widget:
   - Provide a "Sign In" or "Log In" button in the navigation header.
   - When a user is logged in, this should dynamically update to a user profile avatar or displaying "Welcome, [user-email]" alongside a "Log Out" button.
2. Sign Up & Sign In Forms UI:
   - Create a gorgeous modal overlay styled with Tailwind CSS (using slick transitions, glassmorphism or high-contrast modern card styles, custom input fields, elegant state transition animations) containing both login and registration tabs.
3. Live Integration JavaScript Script:
   - Include a JavaScript block at the bottom of the body (before analytics/Smartsupp scripts) that handles signup, login, session persistence, and error states.
   - The auth API endpoint is exactly: 'https://${host}/api/site-auth'
   - The unique hardcoded site_id for this generated site is: '${siteId}'
   - API Request Formats:
     - To Sign Up: Send a POST request to 'https://${host}/api/site-auth' with JSON headers and body:
       { "action": "signup", "site_id": "${siteId}", "email": "userEmail", "password": "userPassword" }
     - To Log In: Send a POST request to 'https://${host}/api/site-auth' with JSON headers and body:
       { "action": "login", "site_id": "${siteId}", "email": "userEmail", "password": "userPassword" }
   - Success and Failure Handlers:
     - On Success (signup/login): Save the returned user info in localStorage under the key 'site_session' (e.g. localStorage.setItem('site_session', JSON.stringify(data))).
     - Close the auth modal, show a beautiful, modern floating toast alert (notification) on the site, and update the UI elements immediately.
     - On Failure: Display a user-friendly error message in a custom red alert box within the modal form itself.
4. Session Persistence & Log Out:
   - On page load (DOMContentLoaded), check if localStorage.getItem('site_session') exists. If so, parse it and update the navbar/header UI immediately to show the logged-in state.
   - When clicking "Log Out", remove the session (localStorage.removeItem('site_session')) and reset the UI to its default logged-out state.
5. Absolute Design Harmony:
   - Keep the design high contrast, professional, responsive, and 100% aligned with the rest of the website's theme and font choice.`;
  }

  try {
    let code = "";
    if (model === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: finalSystemPrompt },
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
            systemInstruction: finalSystemPrompt
        }
      });
      code = response.text || "";
    }

    // Remove markdown code blocks if any (fallback)
    code = code.replace(/```html\n?|```/g, "").trim();

    // Success database log and credit decrement
    if (userId) {
      await logGenerationEvent(userId, existingCode ? 'refine' : 'layout', prompt, code);
      if (model === "openai") {
        await decrementUserCredits(userId);
      }
    }

    // Programmatic Telegram Channel Syndication Loop
    // Fired as part of a successful website generation event. Runs silently with fault tolerance.
    await syndicateToTelegram();

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
