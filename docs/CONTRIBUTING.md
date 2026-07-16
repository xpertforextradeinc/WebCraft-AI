# SimuPay Pro Contributor Guidelines

Welcome to the **SimuPay Pro** contributor guide! We are thrilled that you are contributing to our modern AI-assisted fintech website building and payment orchestration platform.

To maintain production-quality code, please review these architectural, code quality, and styling guidelines before making changes.

---

## 🛠️ Tech Stack & Key Architectures

- **Frontend Core:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Backend/API Services:** Node.js, Express, TSX, dynamic server-less API architecture suitable for Vercel functions (under `/api/`).
- **Database & Auth:** Supabase (PostgreSQL) client configurations, using Row Level Security (RLS) policies.
- **AI Synthesis Engine:** `@google/genai` TypeScript SDK utilizing the standard `gemini-2.5-flash` model, driving prompt templates defined inside `/api/generate.ts`.
- **Payment Gateway:** Flutterwave client-side SDK integration and server-side dynamic subscription plan creators (`/api/flutterwave/create-plans.ts`).

---

## 📂 File Structure Conventions

Maintain the following modular file organization strictly. **Do not** pack all application logic into a single monolithic file.

```
├── api/                             # Server-side API and Serverless Function Endpoints
│   ├── flutterwave/                 # Flutterwave payment and subscription handlers
│   │   └── create-plans.ts          # Subscription plan syncer (with graceful demo fallback)
│   ├── generate.ts                  # Prompt definitions for AI business generator
│   └── site-auth.ts                 # Database credentials and authorization helpers
├── docs/                            # Internal Documentation Folder
│   └── CONTRIBUTING.md              # Contributor documentation (This File)
├── scripts/                         # Maintenance, Clean-up, and Health Diagnostics
│   └── health-check.js              # Project diagnostics checker
├── src/                             # Core React Frontend Application
│   ├── components/                  # Extract modular, single-responsibility components
│   │   ├── BuilderView.tsx          # Main UI view for building, refining, and generating
│   │   ├── HistoryView.tsx          # Past built items view with restoration options
│   │   ├── Navigation.tsx           # Global header tab area and bottom-mobile dock nav
│   │   └── TemplatesView.tsx        # High-converting layout and theme templates
│   ├── App.tsx                      # Root Application, modals, states, and app-lifecycles
│   └── index.css                    # Tailwind CSS import, variables, and font settings
├── vercel.json                      # Production Vercel configurations (Routing & rewrites)
└── package.json                     # Dependency list, build-system commands, and maintenance
```

---

## 📜 Coding Best Practices

### 1. React & TypeScript Standards
- **Functional Components:** Always write functional components paired with React Hooks. Avoid class components entirely.
- **Strict Typing:** Avoid using `any` wherever possible. Define explicit interfaces or types inside `src/types.ts` or in-file where localized.
- **Prevent Re-renders:** Minimize heavy computations inside component rendering blocks. Use `useMemo` or `useCallback` when passing callbacks to children, and keep `useEffect` dependency arrays simple (avoid objects/arrays inside dependencies; use primitive values).

### 2. State & Database Integrity (Supabase RLS)
- Always verify that state changes are synchronized with Supabase database structures.
- Handle active guest accounts securely by saving guest session identifiers (`webcraft_guest_id`) to `localStorage` fallback when standard auth profiles aren't logged in.
- Honor Postgres constraints and Row Level Security. Never expose sensitive service tokens client-side.

### 3. Tailwind CSS & UI Design
- **Utility-First:** Write inline Tailwind utility classes for all stylings. Do not create separate `.css` modules or inline styles.
- **Branding Consistency:** Follow the **Fintech Slate & Indigo** UI theme. Keep margins, padding, and roundness values coherent (e.g., `rounded-xl`, `rounded-2xl` for containers).
- **Responsive-First:** Code with mobile-first responsiveness using `sm:`, `md:`, and `lg:` prefixes. Every view must resize elegantly from 360px up to 1920px.

---

## 🤖 Contributing to the AI Builder Prompt (`/api/generate.ts`)

When making modifications to the AI prompt generation engine:
1. **Conversion Intelligence:** Ensure generated sites direct the user toward a clear, singular conversion action (WhatsApp message, booking call, sign-up form).
2. **Nigerian SME Context:** Ensure WhatsApp is used alongside regular input fields as the dominant chat channel.
3. **Typography & Styling:** Use Tailwind v4 classes, highly authentic trust indicators (testimonials with specific, non-generic details), action-specific and urgency-aware wording.

---

## 🧪 Clean-up & Health Check Commands

To verify your contribution does not introduce regressions or break compilations, utilize the following scripts before creating a pull request:

```bash
# 1. Clean build and module caches
npm run clean

# 2. Run TypeScript static compiler check
npm run lint

# 3. Run full project health, directory, and compilability check
npm run health-check

# 4. Trigger local Express development server
npm run dev
```

Thank you for contributing to the future of **SimuPay Pro**! 🚀
