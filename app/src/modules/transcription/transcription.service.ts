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
import type {
  CreateTranscriptionInput,
  ReviewTranscriptionInput,
  TranscriptionRecord
} from "./transcription.schema.js";
import { transcriptionRepository } from "./transcription.repository.js";

export class SourceNotFoundError extends Error {}
export class TranscriptionNotFoundError extends Error {}
export class InvalidTranscriptionTransitionError extends Error {}

export {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  ContributorRoleError
};

export async function createTranscription(
  sourceId: string,
  input: CreateTranscriptionInput
): Promise<TranscriptionRecord> {
  const source = await getSourceById(sourceId);

  if (!source) {
    throw new SourceNotFoundError("Source record does not exist.");
  }

  const transcriber = await requireContributorRole(input.transcriberId, "transcriber");

  if (!transcriber) {
    throw new ContributorNotFoundError("Transcriber does not exist.");
  }

  await requireEligibleConsent({
    consentId: input.consentId,
    contributorId: source.contributorId,
    purpose: "transcription"
  });

  const record: TranscriptionRecord = {
    id: randomUUID(),
    sourceId,
    ...input,
    reviewStatus: "pending_review",
    createdAt: new Date().toISOString(),
    reviewerId: null,
    reviewNote: null,
    verifiedAt: null
  };

  return transcriptionRepository.create(record);
}

export async function verifyTranscription(
  id: string,
  input: ReviewTranscriptionInput
): Promise<TranscriptionRecord> {
  const record = await transcriptionRepository.findById(id);

  if (!record) {
    throw new TranscriptionNotFoundError("Transcription record does not exist.");
  }

  if (record.reviewStatus !== "pending_review") {
    throw new InvalidTranscriptionTransitionError(
      "Only pending transcriptions can be reviewed."
    );
  }

  const reviewer = await requireContributorRole(input.reviewerId, "reviewer");

  if (!reviewer) {
    throw new ContributorNotFoundError("Reviewer does not exist.");
  }

  const source = await getSourceById(record.sourceId);

  if (!source) {
    throw new SourceNotFoundError("Source record does not exist.");
  }

  await requireEligibleConsent({
    consentId: record.consentId,
    contributorId: source.contributorId,
    purpose: "human_review"
  });

  return transcriptionRepository.update({
    ...record,
    reviewStatus: input.decision,
    reviewerId: input.reviewerId,
    reviewNote: input.reviewNote ?? null,
    verifiedAt: new Date().toISOString()
  });
}

export async function getTranscriptionsForSource(
  sourceId: string
): Promise<TranscriptionRecord[]> {
  return transcriptionRepository.findBySourceId(sourceId);
}

export async function getTranscriptionById(
  id: string
): Promise<TranscriptionRecord | undefined> {
  return transcriptionRepository.findById(id);
}
