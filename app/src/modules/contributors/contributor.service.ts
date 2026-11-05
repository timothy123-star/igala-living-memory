
import { randomUUID } from "node:crypto";

import type {
  Contributor,
  ContributorRole,
  CreateContributorInput
} from "./contributor.schema.js";

import { contributorRepository } from "./contributor.repository.js";

export async function createContributor(
  input: CreateContributorInput
): Promise<Contributor> {

  const contributor: Contributor = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };

  return contributorRepository.create(contributor);
}

export async function getContributors(): Promise<Contributor[]> {
  return contributorRepository.findAll();
}

export async function getContributorById(
  id: string
): Promise<Contributor | undefined> {
  return contributorRepository.findById(id);
}

export class ContributorRoleError extends Error {}

export async function requireContributorRole(
  id: string,
  role: ContributorRole
): Promise<Contributor | undefined> {
  const contributor = await contributorRepository.findById(id);

  if (contributor && !contributor.roles.includes(role)) {
    throw new ContributorRoleError(
      `Contributor must have the ${role} role.`
    );
  }

  return contributor;
}
