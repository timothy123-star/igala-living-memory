import { getDatabase } from "../../shared/database/database.js";
import type { ConsentRecord } from "./consent.schema.js";

type ConsentRow = {
  id: string;
  contributor_id: string;
  permissions_json: string;
  status: ConsentRecord["status"];
  consent_method: ConsentRecord["consentMethod"];
  consent_version: string;
  granted_at: string;
  withdrawn_at: string | null;
  evidence_reference: string | null;
};

function toConsent(row: ConsentRow): ConsentRecord {
  return {
    id: row.id,
    contributorId: row.contributor_id,
    permissions: JSON.parse(row.permissions_json),
    status: row.status,
    consentMethod: row.consent_method,
    consentVersion: row.consent_version,
    grantedAt: row.granted_at,
    withdrawnAt: row.withdrawn_at,
    evidenceReference: row.evidence_reference
  };
}

class SqliteConsentRepository {

  async create(consent: ConsentRecord): Promise<ConsentRecord> {
    getDatabase().prepare(`
      INSERT INTO consents (
        id, contributor_id, permissions_json, status, consent_method,
        consent_version, granted_at, withdrawn_at, evidence_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      consent.id,
      consent.contributorId,
      JSON.stringify(consent.permissions),
      consent.status,
      consent.consentMethod,
      consent.consentVersion,
      consent.grantedAt,
      consent.withdrawnAt,
      consent.evidenceReference
    );
    return consent;
  }

  async findById(id: string): Promise<ConsentRecord | undefined> {
    const row = getDatabase().prepare(`
      SELECT id, contributor_id, permissions_json, status, consent_method,
        consent_version, granted_at, withdrawn_at, evidence_reference
      FROM consents WHERE id = ?
    `).get(id) as unknown as ConsentRow | undefined;

    return row ? toConsent(row) : undefined;
  }

  async update(consent: ConsentRecord): Promise<ConsentRecord> {
    getDatabase().prepare(`
      UPDATE consents
      SET permissions_json = ?, status = ?, consent_method = ?, consent_version = ?,
        granted_at = ?, withdrawn_at = ?, evidence_reference = ?
      WHERE id = ?
    `).run(
      JSON.stringify(consent.permissions),
      consent.status,
      consent.consentMethod,
      consent.consentVersion,
      consent.grantedAt,
      consent.withdrawnAt,
      consent.evidenceReference,
      consent.id
    );
    return consent;
  }
}

export const consentRepository = new SqliteConsentRepository();
