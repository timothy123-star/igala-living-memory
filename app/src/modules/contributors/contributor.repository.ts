
import { getDatabase } from "../../shared/database/database.js";
import type { Contributor } from "./contributor.schema.js";

type ContributorRow = {
  id: string;
  public_label: string;
  roles_json: string;
  preferred_language: string;
  created_at: string;
};

function toContributor(row: ContributorRow): Contributor {
  return {
    id: row.id,
    publicLabel: row.public_label,
    roles: JSON.parse(row.roles_json),
    preferredLanguage: row.preferred_language,
    createdAt: row.created_at
  };
}

class SqliteContributorRepository {

  async create(contributor: Contributor): Promise<Contributor> {
    getDatabase().prepare(`
      INSERT INTO contributors (id, public_label, roles_json, preferred_language, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      contributor.id,
      contributor.publicLabel,
      JSON.stringify(contributor.roles),
      contributor.preferredLanguage,
      contributor.createdAt
    );
    return contributor;
  }

  async findAll(): Promise<Contributor[]> {
    const rows = getDatabase().prepare(`
      SELECT id, public_label, roles_json, preferred_language, created_at
      FROM contributors ORDER BY created_at ASC
    `).all() as unknown as ContributorRow[];

    return rows.map(toContributor);
  }

  async findById(id: string): Promise<Contributor | undefined> {
    const row = getDatabase().prepare(`
      SELECT id, public_label, roles_json, preferred_language, created_at
      FROM contributors WHERE id = ?
    `).get(id) as unknown as ContributorRow | undefined;

    return row ? toContributor(row) : undefined;
  }
}

export const contributorRepository =
  new SqliteContributorRepository();
