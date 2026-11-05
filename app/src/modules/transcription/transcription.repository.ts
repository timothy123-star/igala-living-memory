import { getDatabase } from "../../shared/database/database.js";
import type { TranscriptionRecord } from "./transcription.schema.js";

type TranscriptionRow = {
  id: string;
  source_id: string;
  transcriber_id: string;
  consent_id: string;
  original_text: string;
  language: "Igala";
  transcription_method: "human_entered";
  review_status: TranscriptionRecord["reviewStatus"];
  created_at: string;
  reviewer_id: string | null;
  review_note: string | null;
  verified_at: string | null;
};

function toTranscription(row: TranscriptionRow): TranscriptionRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    transcriberId: row.transcriber_id,
    consentId: row.consent_id,
    originalText: row.original_text,
    language: row.language,
    transcriptionMethod: row.transcription_method,
    reviewStatus: row.review_status,
    createdAt: row.created_at,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    verifiedAt: row.verified_at
  };
}

class SqliteTranscriptionRepository {

  async create(record: TranscriptionRecord): Promise<TranscriptionRecord> {
    getDatabase().prepare(`
      INSERT INTO transcriptions (
        id, source_id, transcriber_id, consent_id, original_text, language,
        transcription_method, review_status, created_at, reviewer_id, review_note,
        verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.sourceId,
      record.transcriberId,
      record.consentId,
      record.originalText,
      record.language,
      record.transcriptionMethod,
      record.reviewStatus,
      record.createdAt,
      record.reviewerId,
      record.reviewNote,
      record.verifiedAt
    );
    return record;
  }

  async findById(id: string): Promise<TranscriptionRecord | undefined> {
    const row = getDatabase().prepare(`
      SELECT id, source_id, transcriber_id, consent_id, original_text, language,
        transcription_method, review_status, created_at, reviewer_id, review_note,
        verified_at
      FROM transcriptions WHERE id = ?
    `).get(id) as unknown as TranscriptionRow | undefined;

    return row ? toTranscription(row) : undefined;
  }

  async findBySourceId(sourceId: string): Promise<TranscriptionRecord[]> {
    const rows = getDatabase().prepare(`
      SELECT id, source_id, transcriber_id, consent_id, original_text, language,
        transcription_method, review_status, created_at, reviewer_id, review_note,
        verified_at
      FROM transcriptions WHERE source_id = ? ORDER BY created_at ASC
    `).all(sourceId) as unknown as TranscriptionRow[];

    return rows.map(toTranscription);
  }

  async update(record: TranscriptionRecord): Promise<TranscriptionRecord> {
    getDatabase().prepare(`
      UPDATE transcriptions
      SET review_status = ?, reviewer_id = ?, review_note = ?, verified_at = ?
      WHERE id = ?
    `).run(
      record.reviewStatus,
      record.reviewerId,
      record.reviewNote,
      record.verifiedAt,
      record.id
    );
    return record;
  }
}

export const transcriptionRepository = new SqliteTranscriptionRepository();
