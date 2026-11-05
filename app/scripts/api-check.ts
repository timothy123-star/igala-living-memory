import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.MODEL_API_KEY;
const model = process.env.META_MODEL ?? "muse-spark-1.3";

if (!apiKey) {
  console.error("ERROR: MODEL_API_KEY is missing.");
  console.error("Create a .env file from .env.example and add your Meta Model API key.");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://api.meta.ai/v1",
  apiKey,
});

async function main(): Promise<void> {
  console.log(`Testing Meta Model API with model: ${model}`);

  try {
    const response = await client.responses.create({
      model,
      input: "This is a connectivity test for a software project. Reply with exactly the single word READY.",
    });

    console.log("\nAPI call succeeded.");
    console.log("Model response:", response.output_text || "[No plain-text output returned]");

    if (response.usage) {
      console.log("Token usage:", JSON.stringify(response.usage));
    }

    console.log("\nMILESTONE PASSED: the project can reach Meta Model API.");
  } catch (error: unknown) {
    console.error("\nMeta Model API request failed.");

    if (error instanceof OpenAI.APIError) {
      console.error(`HTTP status: ${error.status ?? "unknown"}`);
      console.error(`Error type: ${error.name}`);
      console.error(`Message: ${error.message}`);
      if (error.status === 401 || error.status === 403) {
        console.error("Check that the API key is correct and that your account/team has access.");
      } else if (error.status === 402) {
        console.error("Check billing, credit availability, and any payment-method requirement in the dashboard.");
      } else if (error.status === 429) {
        console.error("Check rate limits, account limits, and credit availability before retrying.");
      }
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred.");
    }

    process.exitCode = 1;
  }
}

await main();
