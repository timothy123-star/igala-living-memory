import "dotenv/config";
import express from "express";
import helmet from "helmet";
import OpenAI from "openai";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// Check whether the backend is running.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "igala-living-memory-api",
    message: "Igala Living Memory backend is running."
  });
});

// Test connectivity to Meta Model API.
app.post("/api/model-test", async (_req, res) => {
  const apiKey = process.env.MODEL_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      status: "not_configured",
      message: "MODEL_API_KEY has not been configured."
    });
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.meta.ai/v1"
    });

    const response = await client.responses.create({
      model: "muse-spark-1.3",
      input: "Reply with exactly one word: READY"
    });

    return res.status(200).json({
      status: "ok",
      model: response.model,
      output: response.output_text
    });
  } catch (error) {
    console.error(
      "Meta API request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return res.status(502).json({
      status: "error",
      message: "The Meta Model API request failed. Check the backend logs."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Igala Living Memory API running at http://localhost:${PORT}`
  );
});