import { randomUUID } from "node:crypto";

import { getContributorById } from "../contributors/contributor.service.js";
import type {
  ConsentPurpose,
  ConsentRecord,
  CreateConsentInput
} from "./consent.schema.js";
import { consentRepository } from "./consent.repository.js";

export class ContributorNotFoundError extends Error {}
export class ConsentNotFoundError extends Error {}
export class ConsentInactiveError extends Error {}
export class ConsentPermissionDeniedError extends Error {}

export async function createConsent(
  input: CreateConsentInput
): Promise<ConsentRecord> {
  const contributor = await getContributorById(input.contributorId);

  if (!contributor) {
    throw new ContributorNotFoundError("Contributor does not exist.");
  }

  const consent: ConsentRecord = {
    ...input,
    id: randomUUID(),
    status: "active",
    grantedAt: new Date().toISOString(),
    withdrawnAt: null
  };

  return consentRepository.create(consent);
}

export async function withdrawConsent(id: string): Promise<ConsentRecord> {
  const consent = await consentRepository.findById(id);

  if (!consent) {
    throw new ConsentNotFoundError("Consent record does not exist.");
  }

  if (consent.status !== "active") {
    throw new ConsentInactiveError("Only active consent records can be withdrawn.");
  }

  return consentRepository.update({
    ...consent,
    status: "withdrawn",
    withdrawnAt: new Date().toISOString()
  });
}

export async function getConsentById(
  id: string
): Promise<ConsentRecord | undefined> {
  return consentRepository.findById(id);
}

/** Mandatory permission boundary for future uses of contributed material. */
export async function requireEligibleConsent(input: {
  consentId: string;
  contributorId: string;
  purpose: ConsentPurpose;
}): Promise<ConsentRecord> {
  const consent = await consentRepository.findById(input.consentId);

  if (!consent) {
    throw new ConsentNotFoundError("Consent record does not exist.");
  }

  if (consent.contributorId !== input.contributorId) {
    throw new ConsentPermissionDeniedError(
      "Consent record does not belong to the expected contributor."
    );
  }

  if (consent.status !== "active") {
    throw new ConsentInactiveError("Consent record is not active.");
  }

  const permission = consent.permissions.find(
    (entry) => entry.purpose === input.purpose
  );

  if (!permission?.granted) {
    throw new ConsentPermissionDeniedError(
      "Consent does not grant the requested purpose."
    );
  }

  return consent;
}
