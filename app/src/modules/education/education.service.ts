import {
  getArchiveRecord,
  getEducationalEligibility,
  type ArchiveRecord
} from "../archive/archive.service.js";
import { generateMetaText, type MetaGenerationResult } from "../../services/meta/meta.service.js";
import {
  GeneratedLessonSchema,
  type CreateEducationalContentInput,
  type GeneratedLesson
} from "./education.schema.js";

export class InsufficientArchiveEvidenceError extends Error {
  constructor(readonly reasons: string[]) {
    super("There is insufficient approved archive evidence for AI-generated educational content.");
  }
}

export interface EducationalContentResult extends MetaGenerationResult {
  humanVerified: false;
  lesson: GeneratedLesson;
  sourceReferences: Array<{
    sourceId: string;
    transcriptionId: string;
    interpretationId: string;
  }>;
}

type GenerateText = (input: string) => Promise<MetaGenerationResult>;

function parseLesson(text: string): GeneratedLesson {
  const json = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    return GeneratedLessonSchema.parse(JSON.parse(json));
  } catch {
    throw new Error("Muse Spark returned an invalid lesson format.");
  }
}

export async function createGroundedEducationalContentForArchive(
  archive: ArchiveRecord,
  input: CreateEducationalContentInput,
  generate: GenerateText = generateMetaText
): Promise<EducationalContentResult> {
  const eligibility = getEducationalEligibility(archive);

  if (!eligibility.eligible) {
    throw new InsufficientArchiveEvidenceError(eligibility.reasons);
  }

  const evidence = archive.transcriptions.flatMap(({ record, interpretations }) =>
    record.reviewStatus === "verified"
      ? interpretations
        .filter(({ record: interpretation }) => interpretation.reviewStatus === "verified")
        .map(({ record: interpretation }) => ({
          transcription: record.originalText,
          interpretation: interpretation.interpretationText,
          transcriptionId: record.id,
          interpretationId: interpretation.id
        }))
      : []
  );

  if (evidence.length === 0) {
    throw new InsufficientArchiveEvidenceError([
      "No paired human-verified transcription and interpretation is available."
    ]);
  }

  const generated = await generate([
    "Create a structured educational lesson using only the approved archive evidence below.",
    "Do not add cultural or linguistic facts that are not in the evidence.",
    "The Igala text is a human-confirmed transcription. English is a caption-aligned interpretation, not an independent translation.",
    "Use proverbActivities only for exact Igala/English pairs in the evidence.",
    "Set vocabularyExercises to [] unless the evidence itself defines reliable vocabulary meanings.",
    "If the learner request cannot be answered using this evidence, put 'Insufficient archive evidence to answer this request.' in explanation and use only empty activity/question arrays where allowed.",
    "Return JSON only, with this exact shape: {title, learningObjectives, explanation, proverbActivities:[{igala, interpretation, activity}], vocabularyExercises:[{term,prompt,answer}], comprehensionQuestions:[{question,answer}], quizQuestions:[{question,answer}], evidenceStatement}.",
    `Learner request: ${input.prompt}`,
    `Approved archive evidence: ${JSON.stringify(evidence)}`
  ].join("\n\n"));

  const lesson = parseLesson(generated.text);

  return {
    ...generated,
    lesson,
    humanVerified: false,
    sourceReferences: evidence.map(({ transcriptionId, interpretationId }) => ({
      sourceId: archive.source.id,
      transcriptionId,
      interpretationId
    }))
  };
}

export async function createGroundedEducationalContent(
  sourceId: string,
  input: CreateEducationalContentInput
): Promise<EducationalContentResult> {
  const archive = await getArchiveRecord(sourceId);
  return createGroundedEducationalContentForArchive(archive, input);
}
