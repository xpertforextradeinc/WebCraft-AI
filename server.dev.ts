import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import our central, production-ready Vercel handlers
import generateHandler from "./api/generate";
import generateMediaHandler from "./api/generate-media";
import paystackWebhookHandler from "./api/webhook/paystack";
import flutterwaveCreatePlansHandler from "./api/flutterwave/create-plans";
import flutterwaveWebhookHandler from "./api/webhook/flutterwave";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Mount API endpoints directly to their corresponding serverless route handlers
  // This avoids logic duplication and guarantees 100% local-to-production fidelity!
  app.post("/api/generate", async (req, res, next) => {
    try {
      await generateHandler(req as any, res as any);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/generate-media", async (req, res, next) => {
    try {
      await generateMediaHandler(req as any, res as any);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/webhook/paystack", async (req, res, next) => {
    try {
      await paystackWebhookHandler(req as any, res as any);
    } catch (err) {
      next(err);
    }
  });

  // Support both GET and POST for triggering the Flutterwave plans creation setup
  app.all("/api/flutterwave/create-plans", async (req, res, next) => {
    try {
      await flutterwaveCreatePlansHandler(req as any, res as any);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/webhook/flutterwave", async (req, res, next) => {
    try {
      await flutterwaveWebhookHandler(req as any, res as any);
    } catch (err) {
      next(err);
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
    console.log(`[WebCraft AI] Server running on http://localhost:${PORT}`);
  });
}

startServer();
