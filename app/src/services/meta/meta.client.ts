
import OpenAI from "openai";

let client: OpenAI | undefined;

export function getMetaClient(): OpenAI {
  if (client) {
    return client;
  }

  const apiKey = process.env.MODEL_API_KEY;

  if (!apiKey) {
    throw new Error("MODEL_API_KEY is not configured.");
  }

  client = new OpenAI({
    baseURL: "https://api.meta.ai/v1",
    apiKey
  });

  return client;
}

export function getMetaModel(): string {
  return process.env.META_MODEL ?? "muse-spark-1.3";
}
