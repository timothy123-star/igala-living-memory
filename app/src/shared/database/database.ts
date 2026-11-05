import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const databasePath = fileURLToPath(
  new URL("../../../../data/igala-living-memory.sqlite", import.meta.url)
);
const schemaVersion = 3;

let database: DatabaseSync | undefined;

export function initializeDatabase(): DatabaseSync {
  if (database) {
    return database;
  }

  mkdirSync(dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");

  const currentVersion = database.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };

  if (currentVersion.user_version < schemaVersion) {
    database.exec("BEGIN IMMEDIATE;");

    try {
      database.exec(`
        CREATE TABLE IF NOT EXISTS contributors (
          id TEXT PRIMARY KEY,
          public_label TEXT NOT NULL,
          roles_json TEXT NOT NULL,
          preferred_language TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS consents (
          id TEXT PRIMARY KEY,
          contributor_id TEXT NOT NULL,
          permissions_json TEXT NOT NULL,
          status TEXT NOT NULL,
          consent_method TEXT NOT NULL,
          consent_version TEXT NOT NULL,
          granted_at TEXT NOT NULL,
          withdrawn_at TEXT,
          evidence_reference TEXT,
          FOREIGN KEY (contributor_id) REFERENCES contributors(id),
          UNIQUE (id, contributor_id)
        );

        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY,
          contributor_id TEXT NOT NULL,
          consent_id TEXT NOT NULL,
          title TEXT,
          context TEXT,
          source_language TEXT NOT NULL,
          media_type TEXT NOT NULL,
          storage_key TEXT NOT NULL UNIQUE,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          review_status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (contributor_id) REFERENCES contributors(id),
          FOREIGN KEY (consent_id, contributor_id)
            REFERENCES consents(id, contributor_id)
        );

        CREATE TABLE IF NOT EXISTS transcriptions (
          id TEXT PRIMARY KEY,
          source_id TEXT NOT NULL,
          transcriber_id TEXT NOT NULL,
          consent_id TEXT NOT NULL,
          original_text TEXT NOT NULL,
          language TEXT NOT NULL,
          transcription_method TEXT NOT NULL,
          review_status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          reviewer_id TEXT,
          review_note TEXT,
          verified_at TEXT,
          FOREIGN KEY (source_id) REFERENCES sources(id),
          FOREIGN KEY (transcriber_id) REFERENCES contributors(id),
          FOREIGN KEY (consent_id) REFERENCES consents(id),
          FOREIGN KEY (reviewer_id) REFERENCES contributors(id)
        );

        CREATE TABLE IF NOT EXISTS interpretations (
          id TEXT PRIMARY KEY,
          transcription_id TEXT NOT NULL,
          interpretation_text TEXT NOT NULL,
          source_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          translator_id TEXT NOT NULL,
          consent_id TEXT NOT NULL,
          review_status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          reviewer_id TEXT,
          review_note TEXT,
          verified_at TEXT,
          FOREIGN KEY (transcription_id) REFERENCES transcriptions(id),
          FOREIGN KEY (translator_id) REFERENCES contributors(id),
          FOREIGN KEY (consent_id) REFERENCES consents(id),
          FOREIGN KEY (reviewer_id) REFERENCES contributors(id)
        );

        CREATE INDEX IF NOT EXISTS idx_consents_contributor_id
          ON consents(contributor_id);
        CREATE INDEX IF NOT EXISTS idx_sources_contributor_id
          ON sources(contributor_id);
        CREATE INDEX IF NOT EXISTS idx_sources_consent_id ON sources(consent_id);
        CREATE INDEX IF NOT EXISTS idx_transcriptions_source_id
          ON transcriptions(source_id);
        CREATE INDEX IF NOT EXISTS idx_transcriptions_consent_id
          ON transcriptions(consent_id);
        CREATE INDEX IF NOT EXISTS idx_interpretations_transcription_id
          ON interpretations(transcription_id);
        CREATE INDEX IF NOT EXISTS idx_interpretations_consent_id
          ON interpretations(consent_id);
      `);
      if (currentVersion.user_version < 2) {
        database.exec(`
          ALTER TABLE sources ADD COLUMN reviewer_id TEXT;
          ALTER TABLE sources ADD COLUMN review_note TEXT;
          ALTER TABLE sources ADD COLUMN verified_at TEXT;
        `);
      }

      if (currentVersion.user_version < 3) {
        database.exec(`
          CREATE TABLE IF NOT EXISTS source_consent_transitions (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            previous_consent_id TEXT NOT NULL,
            new_consent_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            changed_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES sources(id),
            FOREIGN KEY (previous_consent_id) REFERENCES consents(id),
            FOREIGN KEY (new_consent_id) REFERENCES consents(id)
          );
          CREATE INDEX IF NOT EXISTS idx_source_consent_transitions_source_id
            ON source_consent_transitions(source_id);
        `);
      }

      database.exec(`PRAGMA user_version = ${schemaVersion};`);
      database.exec("COMMIT;");
    } catch (error) {
      database.exec("ROLLBACK;");
      database.close();
      database = undefined;
      throw error;
    }
  }

  return database;
}

export function getDatabase(): DatabaseSync {
  if (!database) {
    throw new Error("Database has not been initialized.");
  }

  return database;
}

export function closeDatabase(): void {
  database?.close();
  database = undefined;
}

export { databasePath };
