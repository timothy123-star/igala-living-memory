import { getConsentById } from "../consent/consent.service.js";
import { getContributorById } from "../contributors/contributor.service.js";
import { getInterpretationsForTranscription } from "../interpretation/interpretation.service.js";
import { getSourceById } from "../source/source.service.js";
import { getTranscriptionsForSource } from "../transcription/transcription.service.js";

export class ArchiveSourceNotFoundError extends Error {}

export interface ArchiveRecord {
  /** Public provenance metadata; the private raw-media storage key is omitted. */
  source: Omit<NonNullable<Awaited<ReturnType<typeof getSourceById>>>, "storageKey">;
  contributor: NonNullable<Awaited<ReturnType<typeof getContributorById>>>;
  consent: NonNullable<Awaited<ReturnType<typeof getConsentById>>>;
  audio: {
    availability: "private" | "public";
    reason: string;
  };
  transcriptions: Array<{
    record: Awaited<ReturnType<typeof getTranscriptionsForSource>>[number];
    transcriber: Awaited<ReturnType<typeof getContributorById>>;
    reviewer: Awaited<ReturnType<typeof getContributorById>>;
    interpretations: Array<{
      record: Awaited<ReturnType<typeof getInterpretationsForTranscription>>[number];
      translator: Awaited<ReturnType<typeof getContributorById>>;
      reviewer: Awaited<ReturnType<typeof getContributorById>>;
    }>;
  }>;
}

function hasGrantedPermission(
  consent: ArchiveRecord["consent"],
  purpose: string
): boolean {
  return consent.status === "active" && consent.permissions.some(
    (permission) => permission.purpose === purpose && permission.granted
  );
}

/**
 * Read-only demo projection. It deliberately exposes audio metadata, never raw
 * private media; raw audio needs explicit public-distribution consent.
 */
export async function getArchiveRecord(sourceId: string): Promise<ArchiveRecord> {
  const source = await getSourceById(sourceId);

  if (!source) {
    throw new ArchiveSourceNotFoundError("Source record does not exist.");
  }

  const [contributor, consent, transcriptionRecords] = await Promise.all([
    getContributorById(source.contributorId),
    getConsentById(source.consentId),
    getTranscriptionsForSource(source.id)
  ]);

  if (!contributor || !consent) {
    throw new Error("The source has incomplete provenance references.");
  }

  const transcriptions = await Promise.all(transcriptionRecords.map(async (record) => {
    const [transcriber, reviewer, interpretationRecords] = await Promise.all([
      getContributorById(record.transcriberId),
      record.reviewerId ? getContributorById(record.reviewerId) : undefined,
      getInterpretationsForTranscription(record.id)
    ]);

    const interpretations = await Promise.all(interpretationRecords.map(async (interpretation) => ({
      record: interpretation,
      translator: await getContributorById(interpretation.translatorId),
      reviewer: interpretation.reviewerId
        ? await getContributorById(interpretation.reviewerId)
        : undefined
    })));

    return { record, transcriber, reviewer, interpretations };
  }));

  const canDistributeAudio = hasGrantedPermission(consent, "public_audio_distribution");

  const { storageKey: _storageKey, ...publicSource } = source;

  return {
    source: publicSource,
    contributor,
    consent,
    audio: canDistributeAudio
      ? { availability: "public", reason: "Consent permits public audio distribution." }
      : {
          availability: "private",
          reason: "Raw audio is retained privately; this consent does not grant public audio distribution."
        },
    transcriptions
  };
}

export function getEducationalEligibility(record: ArchiveRecord): {
  eligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (record.source.reviewStatus !== "approved") {
    reasons.push("The source audio has not been approved for archive use.");
  }

  if (!hasGrantedPermission(record.consent, "ai_processing")) {
    reasons.push("Consent does not grant AI processing.");
  }

  if (!hasGrantedPermission(record.consent, "educational_publication")) {
    reasons.push("Consent does not grant educational publication.");
  }

  if (!record.transcriptions.some(({ record: transcription }) => transcription.reviewStatus === "verified")) {
    reasons.push("No human-verified Igala transcription is available.");
  }

  if (!record.transcriptions.some(({ interpretations }) =>
    interpretations.some(({ record: interpretation }) => interpretation.reviewStatus === "verified")
  )) {
    reasons.push("No human-verified English interpretation is available.");
  }

  return { eligible: reasons.length === 0, reasons };
}
