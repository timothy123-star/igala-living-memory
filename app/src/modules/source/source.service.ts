import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { getContributorById } from "../contributors/contributor.service.js";
import { ContributorRoleError, requireContributorRole } from "../contributors/contributor.service.js";
import {
  ContributorNotFoundError,
  requireEligibleConsent
} from "../consent/consent.service.js";
import type { ChangeSourceConsentInput, CreateSourceMetadata, ReviewSourceInput, SourceRecord } from "./source.schema.js";
import { sourceRepository } from "./source.repository.js";

const rawStorageDirectory = fileURLToPath(
  new URL("../../../../data/raw/", import.meta.url)
);

const extensionByMimeType: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "audio/flac": ".flac"
};

export function isSupportedAudioMimeType(mimeType: string): boolean {
  return mimeType in extensionByMimeType;
}

export class SourceNotFoundError extends Error {}
export class InvalidSourceReviewTransitionError extends Error {}
export { ContributorRoleError };

export async function createSource(
  metadata: CreateSourceMetadata,
  audio: Express.Multer.File
): Promise<SourceRecord> {
  const contributor = await getContributorById(metadata.contributorId);

  if (!contributor) {
    throw new ContributorNotFoundError("Contributor does not exist.");
  }

  await requireEligibleConsent({
    consentId: metadata.consentId,
    contributorId: metadata.contributorId,
    purpose: "recording"
  });
  await requireEligibleConsent({
    consentId: metadata.consentId,
    contributorId: metadata.contributorId,
    purpose: "storage"
  });

  const id = randomUUID();
  const extension = extensionByMimeType[audio.mimetype];

  if (!extension) {
    throw new Error("Unsupported audio media type.");
  }

  const filename = `${id}${extension}`;
  const storageKey = `raw/${filename}`;
  const destination = new URL(filename, new URL("../../../../data/raw/", import.meta.url));
  const destinationPath = fileURLToPath(destination);
  const checksum = createHash("sha256").update(audio.buffer).digest("hex");

  try {
    await mkdir(rawStorageDirectory, { recursive: true });
    await writeFile(destinationPath, audio.buffer, { flag: "wx" });
  } catch (error) {
    await unlink(destinationPath).catch(() => undefined);
    throw error;
  }

  const source: SourceRecord = {
    id,
    contributorId: metadata.contributorId,
    consentId: metadata.consentId,
    title: metadata.title ?? null,
    context: metadata.context ?? null,
    sourceLanguage: metadata.sourceLanguage,
    mediaType: "audio",
    storageKey,
    mimeType: audio.mimetype,
    fileSize: audio.size,
    checksum,
    reviewStatus: "pending_review",
    createdAt: new Date().toISOString(),
    reviewerId: null,
    reviewNote: null,
    verifiedAt: null
  };

  try {
    return await sourceRepository.create(source);
  } catch (error) {
    await unlink(destinationPath).catch(() => undefined);
    throw error;
  }
}

/** Records a reviewer decision without changing contributor consent. */
export async function reviewSource(
  id: string,
  input: ReviewSourceInput
): Promise<SourceRecord> {
  const source = await getSourceById(id);
  if (!source) throw new SourceNotFoundError("Source record does not exist.");
  if (source.reviewStatus !== "pending_review") {
    throw new InvalidSourceReviewTransitionError("Only pending sources can be reviewed.");
  }
  const reviewer = await requireContributorRole(input.reviewerId, "reviewer");
  if (!reviewer) throw new ContributorNotFoundError("Reviewer does not exist.");
  await requireEligibleConsent({
    consentId: source.consentId,
    contributorId: source.contributorId,
    purpose: "human_review"
  });
  return sourceRepository.updateReview({
    ...source,
    reviewStatus: input.decision,
    reviewerId: input.reviewerId,
    reviewNote: input.reviewNote,
    verifiedAt: new Date().toISOString()
  });
}

/** Switches a source to a later active consent and preserves the transition history. */
export async function changeSourceConsent(
  id: string,
  input: ChangeSourceConsentInput
): Promise<SourceRecord> {
  const source = await getSourceById(id);
  if (!source) throw new SourceNotFoundError("Source record does not exist.");
  if (source.consentId === input.consentId) return source;

  await requireEligibleConsent({ consentId: input.consentId, contributorId: source.contributorId, purpose: "recording" });
  await requireEligibleConsent({ consentId: input.consentId, contributorId: source.contributorId, purpose: "storage" });
  const changedAt = new Date().toISOString();
  const updated = await sourceRepository.updateConsent({ ...source, consentId: input.consentId });
  await sourceRepository.recordConsentTransition({
    id: randomUUID(),
    sourceId: source.id,
    previousConsentId: source.consentId,
    newConsentId: input.consentId,
    reason: "Active consent extension recorded for this existing source.",
    changedAt
  });
  return updated;
}

export async function getSources(): Promise<SourceRecord[]> {
  return sourceRepository.findAll();
}

export async function getSourceById(
  id: string
): Promise<SourceRecord | undefined> {
  return sourceRepository.findById(id);
}
