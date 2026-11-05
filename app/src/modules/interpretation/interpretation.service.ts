import { randomUUID } from "node:crypto";

import {
  ContributorRoleError,
  requireContributorRole
} from "../contributors/contributor.service.js";
import {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  requireEligibleConsent
} from "../consent/consent.service.js";
import { getSourceById } from "../source/source.service.js";
import {
  getTranscriptionById,
  SourceNotFoundError,
  TranscriptionNotFoundError
} from "../transcription/transcription.service.js";
import type {
  CreateInterpretationInput,
  InterpretationRecord,
  ReviewInterpretationInput
} from "./interpretation.schema.js";
import { interpretationRepository } from "./interpretation.repository.js";

export class InterpretationNotFoundError extends Error {}
export class InvalidInterpretationTransitionError extends Error {}

export {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  ContributorRoleError,
  SourceNotFoundError,
  TranscriptionNotFoundError
};

export async function createInterpretation(
  transcriptionId: string,
  input: CreateInterpretationInput
): Promise<InterpretationRecord> {
  const transcription = await getTranscriptionById(transcriptionId);

  if (!transcription) {
    throw new TranscriptionNotFoundError("Transcription record does not exist.");
  }

  const source = await getSourceById(transcription.sourceId);

  if (!source) {
    throw new SourceNotFoundError("Source record does not exist.");
  }

  const translator = await requireContributorRole(input.translatorId, "translator");

  if (!translator) {
    throw new ContributorNotFoundError("Translator does not exist.");
  }

  await requireEligibleConsent({
    consentId: input.consentId,
    contributorId: source.contributorId,
    purpose: "translation"
  });

  const record: InterpretationRecord = {
    id: randomUUID(),
    transcriptionId,
    ...input,
    reviewStatus: "pending_review",
    createdAt: new Date().toISOString(),
    reviewerId: null,
    reviewNote: null,
    verifiedAt: null
  };

  return interpretationRepository.create(record);
}

export async function verifyInterpretation(
  id: string,
  input: ReviewInterpretationInput
): Promise<InterpretationRecord> {
  const record = await interpretationRepository.findById(id);

  if (!record) {
    throw new InterpretationNotFoundError("Interpretation record does not exist.");
  }

  if (record.reviewStatus !== "pending_review") {
    throw new InvalidInterpretationTransitionError(
      "Only pending interpretations can be reviewed."
    );
  }

  const transcription = await getTranscriptionById(record.transcriptionId);

  if (!transcription) {
    throw new TranscriptionNotFoundError("Transcription record does not exist.");
  }

  if (input.decision === "verified" && transcription.reviewStatus === "rejected") {
    throw new InvalidInterpretationTransitionError(
      "An interpretation cannot be verified when its transcription is rejected."
    );
  }

  const source = await getSourceById(transcription.sourceId);

  if (!source) {
    throw new SourceNotFoundError("Source record does not exist.");
  }

  const reviewer = await requireContributorRole(input.reviewerId, "reviewer");

  if (!reviewer) {
    throw new ContributorNotFoundError("Reviewer does not exist.");
  }

  await requireEligibleConsent({
    consentId: record.consentId,
    contributorId: source.contributorId,
    purpose: "human_review"
  });

  return interpretationRepository.update({
    ...record,
    reviewStatus: input.decision,
    reviewerId: input.reviewerId,
    reviewNote: input.reviewNote ?? null,
    verifiedAt: new Date().toISOString()
  });
}

export async function getInterpretationsForTranscription(
  transcriptionId: string
): Promise<InterpretationRecord[]> {
  return interpretationRepository.findByTranscriptionId(transcriptionId);
}

export async function getInterpretationById(
  id: string
): Promise<InterpretationRecord | undefined> {
  return interpretationRepository.findById(id);
}
