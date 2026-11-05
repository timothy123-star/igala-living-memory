
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { fileURLToPath } from "node:url";

import v1Routes from "./routes/v1/index.js";
import { errorHandler } from "./shared/middleware/error-handler.js";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(fileURLToPath(new URL("../public/", import.meta.url))));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "igala-living-memory-api"
  });
});

// Versioned API routes
app.use("/api/v1", v1Routes);

// Central error handler (must be registered after routes)
app.use(errorHandler);

export default app;
