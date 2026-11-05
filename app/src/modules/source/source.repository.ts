import { getDatabase } from "../../shared/database/database.js";
import type { SourceRecord } from "./source.schema.js";

type SourceRow = {
  id: string;
  contributor_id: string;
  consent_id: string;
  title: string | null;
  context: string | null;
  source_language: "Igala";
  media_type: "audio";
  storage_key: string;
  mime_type: string;
  file_size: number;
  checksum: string;
  review_status: SourceRecord["reviewStatus"];
  created_at: string;
  reviewer_id: string | null;
  review_note: string | null;
  verified_at: string | null;
};

function toSource(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    contributorId: row.contributor_id,
    consentId: row.consent_id,
    title: row.title,
    context: row.context,
    sourceLanguage: row.source_language,
    mediaType: row.media_type,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    checksum: row.checksum,
    reviewStatus: row.review_status,
    createdAt: row.created_at,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    verifiedAt: row.verified_at
  };
}

class SqliteSourceRepository {

  async create(source: SourceRecord): Promise<SourceRecord> {
    getDatabase().prepare(`
      INSERT INTO sources (
        id, contributor_id, consent_id, title, context, source_language, media_type,
        storage_key, mime_type, file_size, checksum, review_status, created_at,
        reviewer_id, review_note, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      source.id,
      source.contributorId,
      source.consentId,
      source.title,
      source.context,
      source.sourceLanguage,
      source.mediaType,
      source.storageKey,
      source.mimeType,
      source.fileSize,
      source.checksum,
      source.reviewStatus,
      source.createdAt,
      source.reviewerId,
      source.reviewNote,
      source.verifiedAt
    );
    return source;
  }

  async findAll(): Promise<SourceRecord[]> {
    const rows = getDatabase().prepare(`
      SELECT id, contributor_id, consent_id, title, context, source_language, media_type,
        storage_key, mime_type, file_size, checksum, review_status, created_at,
        reviewer_id, review_note, verified_at
      FROM sources ORDER BY created_at ASC
    `).all() as unknown as SourceRow[];

    return rows.map(toSource);
  }

  async findById(id: string): Promise<SourceRecord | undefined> {
    const row = getDatabase().prepare(`
      SELECT id, contributor_id, consent_id, title, context, source_language, media_type,
        storage_key, mime_type, file_size, checksum, review_status, created_at,
        reviewer_id, review_note, verified_at
      FROM sources WHERE id = ?
    `).get(id) as unknown as SourceRow | undefined;

    return row ? toSource(row) : undefined;
  }

  async updateReview(source: SourceRecord): Promise<SourceRecord> {
    getDatabase().prepare(`
      UPDATE sources
      SET review_status = ?, reviewer_id = ?, review_note = ?, verified_at = ?
      WHERE id = ?
    `).run(source.reviewStatus, source.reviewerId, source.reviewNote, source.verifiedAt, source.id);
    return source;
  }

  async updateConsent(source: SourceRecord): Promise<SourceRecord> {
    getDatabase().prepare("UPDATE sources SET consent_id = ? WHERE id = ?")
      .run(source.consentId, source.id);
    return source;
  }

  async recordConsentTransition(input: {
    id: string;
    sourceId: string;
    previousConsentId: string;
    newConsentId: string;
    reason: string;
    changedAt: string;
  }): Promise<void> {
    getDatabase().prepare(`
      INSERT INTO source_consent_transitions (
        id, source_id, previous_consent_id, new_consent_id, reason, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.id, input.sourceId, input.previousConsentId, input.newConsentId, input.reason, input.changedAt);
  }
}

export const sourceRepository = new SqliteSourceRepository();
