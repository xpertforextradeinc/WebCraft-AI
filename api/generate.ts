import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { checkUserCredits, decrementUserCredits, logGenerationEvent } from '../src/utils/supabaseServer.js';
import { syndicateToTelegram } from './utils/telegram.js';
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
  
  Follow these core engineering, design, and intelligence principles:
  
  1. Implied Business Type Reasoning & Tailored Visuals: Before writing any code, analyze the user's prompt to determine the exact business type, industry, and target audience. Let this inference guide the entire design system:
     - Visual tone, color palette, typography scale, and layout structure must be uniquely tailored. E.g., a professional law firm should use deep slate/navy color schemes, traditional elegant typography (e.g. serif/sans pairings), and structured content grids; a crypto platform should use a futuristic dark theme with neon gradients, monospace accents, and sleek interactive dashboard widgets; a personal trainer should use high-energy, warm/vibrant colors with bold, high-contrast, motivating typography and clear schedules.
     - Never use generic, identical layouts or color templates across completely different industries.
  
  2. Plausible, Rich & Context-Specific Copy (No Lorem Ipsum): Write authentic, engaging, and persuasive copy specifically tailored to the business. Do NOT use generic placeholder text, "lorem ipsum", or lazy templates. Headlines, feature descriptions, body paragraphs, pricing models, FAQs, and calls-to-action (CTAs) must sound like they were custom-written by a professional copywriter for this specific service.
  
  3. Site-Wide Visual Harmony & Design Consistency: Maintain absolute aesthetic cohesion across the entire page. Use a single, carefully curated color palette (primary, secondary, and accent colors), consistent spacing rhythms, and a unified typography hierarchy site-wide. Avoid random section-to-section style improvisations or visual drifts.
  
  4. Strategic Information Hierarchy: Plan the page layout sections based on a logical conversion funnel. Do not use a rigid, fixed template sequence. Structure sections in a clear hierarchy of importance for a first-time visitor (e.g., a highly captivating Hero & Value Proposition first, Credibility/Social Proof/Partners second, Core Features & Benefits third, Specific Offerings/Pricing plans fourth, followed by interactive FAQs, direct final CTA, and a complete Footer).
  
  5. Incremental Refinement & Preservation (For Follow-Up Requests): If existing code is provided for refinement, you must focus EXCLUSIVELY on implementing the requested changes. Preserve all existing design styles, color palettes, visual themes, typography scales, layout patterns, script tags, and unchanged sections exactly as they are. Do NOT regenerate unrelated sections or let the original design drift.
  
  6. Structure & Styling: Use semantic, clean HTML5. Use Tailwind CSS utility classes exclusively. Implement a refined, modern aesthetic with consistent spacing rhythm and generous whitespace.
  
  7. Responsiveness: Ensure the site is fully mobile-first and works perfectly across all mobile, tablet, and desktop viewports.
  
  8. Icons & UI Details: Use Lucide React icons or raw SVG paths for clean, scalable, and crisp iconography. Build modular, highly detailed, reusable-looking component blocks. Include smooth transitions, micro-interactions, and visual hover feedback on all clickable elements.
  
  9. Code quality: Write clean, well-commented, and highly maintainable code.
  
  10. Output Constraints:
      - Output ONLY the raw HTML and Tailwind CSS code.
      - Do NOT include markdown code blocks (do not wrap in \`\`\`html), do not explain, and do not add conversational text. The output must be ready to be pasted directly into an iframe.
  
  11. Analytics & Analytics Trigger:
      Include a <script> tag at the end of the <body> that attaches a click event listener to the document. When an <a> or <button> is clicked, post a message to the parent window: window.parent.postMessage({ type: 'analytics_click', target: event.target.tagName, text: event.target.innerText || event.target.textContent }, '*');
  
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
