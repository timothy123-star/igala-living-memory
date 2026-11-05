import type { RequestHandler, Response } from "express";

import type {
  ConsentEligibilityQuery,
  CreateConsentInput
} from "./consent.schema.js";
import {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  createConsent,
  requireEligibleConsent,
  withdrawConsent
} from "./consent.service.js";

function sendConsentError(error: unknown, res: Response): boolean {
  if (error instanceof ContributorNotFoundError || error instanceof ConsentNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentInactiveError) {
    res.status(409).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentPermissionDeniedError) {
    res.status(403).json({ status: "fail", message: error.message });
    return true;
  }

  return false;
}

export const create: RequestHandler<
  Record<string, never>,
  unknown,
  CreateConsentInput
> = async (req, res, next) => {
  try {
    const consent = await createConsent(req.body);
    res.status(201).json({ status: "success", data: { consent } });
  } catch (error) {
    if (!sendConsentError(error, res)) next(error);
  }
};

export const withdraw: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const consent = await withdrawConsent(req.params.id);
    res.status(200).json({ status: "success", data: { consent } });
  } catch (error) {
    if (!sendConsentError(error, res)) next(error);
  }
};

export const checkEligibility: RequestHandler<
  { id: string },
  unknown,
  unknown,
  Record<string, never>,
  { validatedQuery: ConsentEligibilityQuery }
> = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;

    await requireEligibleConsent({
      consentId: req.params.id,
      contributorId: query.contributorId,
      purpose: query.purpose
    });

    res.status(200).json({
      status: "success",
      data: { eligible: true, purpose: query.purpose }
    });
  } catch (error) {
    if (!sendConsentError(error, res)) next(error);
  }
};
