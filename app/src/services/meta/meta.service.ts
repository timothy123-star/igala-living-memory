import {
  getMetaClient,
  getMetaModel
} from "./meta.client.js";

export interface MetaGenerationResult {
  text: string;
  model: string;
  usage: unknown;
}

export async function generateMetaText(
  input: string
): Promise<MetaGenerationResult> {

  const model = getMetaModel();
  const client = getMetaClient();

  const response = await client.responses.create({
    model,
    input
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new Error("Meta returned an empty response.");
  }

  return {
    text,
    model,
    usage: response.usage ?? null
  };
}
