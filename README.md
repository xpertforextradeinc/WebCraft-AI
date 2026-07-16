# SimuPay Pro – AI-Powered High-Converting SME Website Builder

SimuPay Pro is a production-grade, full-stack AI website builder and subscription engine. It enables small-to-medium businesses (SMEs) to generate conversion-optimized, professional web presences in minutes. Powered by the modern `@google/genai` TypeScript SDK and Gemini, SimuPay Pro bridges high-fidelity design intelligence with real business psychology to maximize consumer actions.

---

## 🌟 Key Features & Business Conversion Intelligence

### 1. High-Converting AI Generation Template (`/api/generate.ts`)
The system prompt features built-in conversion-optimized structures:
- **Singular Conversion Goal:** Replaces weak, vague "contact us" sections with high-urgency, action-focused modules (e.g., direct WhatsApp chat, call booking, instant subscription, or live booking).
- **Anchor Pricing Models:** Dynamic pricing layouts format with Naira pricing (₦ / NGN) for Nigerian contexts, showing crossed-out "was" price tags alongside the active price.
- **Middle-Tier Highlighting:** Visually accents the recommended plan with a badge (e.g., "Best Value") or distinctive border.
- **WhatsApp Click-to-Chat:** Integrates prominent WhatsApp action buttons for Nigerian SME contexts, recognizing it as the dominant sales and client communication channel.
- **Specific Trust Signals:** Generates highly authentic, detailed client testimonials, risk-reversal terms (e.g., money-back guarantees), and professional certifications instead of generic placeholders.
- **Urgent Call-to-Action:** Directs CTA styling away from "Learn more" or "Submit" toward highly active phrases like "Claim your free trial" or "Book your free consultation".

### 2. Immersive Build Progress Indicator (`/src/components/BuilderView.tsx`)
Features a cosmetic multi-step progress sequencer resembling platforms like Whop. While a generation is in flight, it cycles status messages every 2.5 seconds with a spinning loader, making the AI build feel active and highly responsive:
1. *Analyzing business concept...*
2. *Determining target audience...*
3. *Selecting custom color scheme...*
4. *Structuring conversion funnel...*
5. *Drafting engaging copy...*
6. *Designing custom components...*
7. *Adding WhatsApp click-to-chat...*
8. *Embedding Lucide icon assets...*
9. *Finalizing responsive layouts...*
10. *Generating preview iframe...*

### 3. Subscription & Billing Orchestration (Flutterwave Client/Server Integration)
- Connects to Flutterwave for subscription billing using dynamic weekly, monthly, and yearly plan tiers (₦12,000, ₦24,000, and ₦240,000).
- **Graceful Sandbox Fallback:** Automatically falls back to local sandbox simulations when Flutterwave API keys are unconfigured, allowing developers to demo payment success and add credits without setup friction.

### 4. SPA Clean URLs & Rewrite Configuration (`/vercel.json`)
- Fully configured Vercel rules enforce clean URLs, stripping extensions and routing all client sub-paths back to `/index.html`. This ensures sub-page refreshes never fail with 404 errors.

---

## 📂 Architecture & Directory Map

```
├── api/                             # Serverless API endpoints & functions
│   ├── flutterwave/                 # Flutterwave subscription plan APIs
│   ├── generate-media.ts            # Media content generators
│   ├── generate.ts                  # Gemini prompt configuration
│   └── site-auth.ts                 # Authorization validation
├── docs/                            # Internal Documentation
│   └── CONTRIBUTING.md              # Contributor coding guidelines
├── scripts/                         # Maintenance and diagnostic tools
│   └── health-check.js              # Full-project health-check engine
├── src/                             # Front-end single page app
│   ├── components/                  # Modular React component views
│   ├── App.tsx                      # Root app manager and state container
│   ├── index.css                    # Global Tailwind CSS configurations
│   └── types.ts                     # TypeScript shared type systems
├── vercel.json                      # Vercel deployment routing rules
└── package.json                     # Node script command definitions
```

---

## 🚀 Quick Start & Local Setup

### 1. Requirements
Ensure you have **Node.js** (v18+) and **npm** installed.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the parameters:
```bash
cp .env.example .env
```
Key configurations include:
- `GEMINI_API_KEY`: Secrets key for the Gemini model.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: Credentials for DB integration.
- `VITE_FLUTTERWAVE_PUBLIC_KEY` / `FLUTTERWAVE_SECRET_KEY`: Billing system parameters (or leave unconfigured to auto-trigger the **Sandbox Simulation Mode**).

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```
The server binds to port `3000` and serves the full-stack development experience.

---

## 🛡️ Workspace Health & Quality Control

We provide strong built-in scripts to keep the workspace clean, maintain code health, and verify types before shipping updates:

```bash
# 1. Clean build and compiler cache
npm run clean

# 2. Run static lint checks
npm run lint

# 3. Perform a full-suite directory structure & health check
npm run health-check
```

---

## 🤝 Contributing
For details on coding practices, Tailwind styling rules, git workflows, and contribution pipelines, check out our **[Contributor Guidelines](./docs/CONTRIBUTING.md)**.
