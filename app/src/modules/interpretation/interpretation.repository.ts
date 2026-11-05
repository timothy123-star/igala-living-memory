import { getDatabase } from "../../shared/database/database.js";
import type { InterpretationRecord } from "./interpretation.schema.js";

type InterpretationRow = {
  id: string;
  transcription_id: string;
  interpretation_text: string;
  source_language: "Igala";
  target_language: "English";
  translator_id: string;
  consent_id: string;
  review_status: InterpretationRecord["reviewStatus"];
  created_at: string;
  reviewer_id: string | null;
  review_note: string | null;
  verified_at: string | null;
};

function toInterpretation(row: InterpretationRow): InterpretationRecord {
  return {
    id: row.id,
    transcriptionId: row.transcription_id,
    interpretationText: row.interpretation_text,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    translatorId: row.translator_id,
    consentId: row.consent_id,
    reviewStatus: row.review_status,
    createdAt: row.created_at,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    verifiedAt: row.verified_at
  };
}

class SqliteInterpretationRepository {

  async create(record: InterpretationRecord): Promise<InterpretationRecord> {
    getDatabase().prepare(`
      INSERT INTO interpretations (
        id, transcription_id, interpretation_text, source_language, target_language,
        translator_id, consent_id, review_status, created_at, reviewer_id, review_note,
        verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.transcriptionId,
      record.interpretationText,
      record.sourceLanguage,
      record.targetLanguage,
      record.translatorId,
      record.consentId,
      record.reviewStatus,
      record.createdAt,
      record.reviewerId,
      record.reviewNote,
      record.verifiedAt
    );
    return record;
  }

  async findById(id: string): Promise<InterpretationRecord | undefined> {
    const row = getDatabase().prepare(`
      SELECT id, transcription_id, interpretation_text, source_language, target_language,
        translator_id, consent_id, review_status, created_at, reviewer_id, review_note,
        verified_at
      FROM interpretations WHERE id = ?
    `).get(id) as unknown as InterpretationRow | undefined;

    return row ? toInterpretation(row) : undefined;
  }

  async findByTranscriptionId(
    transcriptionId: string
  ): Promise<InterpretationRecord[]> {
    const rows = getDatabase().prepare(`
      SELECT id, transcription_id, interpretation_text, source_language, target_language,
        translator_id, consent_id, review_status, created_at, reviewer_id, review_note,
        verified_at
      FROM interpretations WHERE transcription_id = ? ORDER BY created_at ASC
    `).all(transcriptionId) as unknown as InterpretationRow[];

    return rows.map(toInterpretation);
  }

  async update(record: InterpretationRecord): Promise<InterpretationRecord> {
    getDatabase().prepare(`
      UPDATE interpretations
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

export const interpretationRepository = new SqliteInterpretationRepository();
