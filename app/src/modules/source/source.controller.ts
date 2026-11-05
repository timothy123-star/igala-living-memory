import type { RequestHandler, Response } from "express";

import {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError
} from "../consent/consent.service.js";
import type { CreateSourceMetadata } from "./source.schema.js";
import type { ReviewSourceInput } from "./source.schema.js";
import type { ChangeSourceConsentInput } from "./source.schema.js";
import {
  createSource,
  getSourceById,
  getSources
} from "./source.service.js";
import { changeSourceConsent, InvalidSourceReviewTransitionError, reviewSource, SourceNotFoundError } from "./source.service.js";

function sendSourceError(error: unknown, res: Response): boolean {
  if (error instanceof ContributorNotFoundError || error instanceof ConsentNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof SourceNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof InvalidSourceReviewTransitionError) {
    res.status(409).json({ status: "fail", message: error.message });
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
  CreateSourceMetadata
> = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: "fail",
        message: "An audio file is required."
      });
      return;
    }

    const source = await createSource(req.body, req.file);
    res.status(201).json({ status: "success", data: { source } });
  } catch (error) {
    if (!sendSourceError(error, res)) next(error);
  }
};

export const getAll: RequestHandler = async (_req, res, next) => {
  try {
    const sources = await getSources();
    res.status(200).json({
      status: "success",
      results: sources.length,
      data: { sources }
    });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const source = await getSourceById(req.params.id);

    if (!source) {
      res.status(404).json({ status: "fail", message: "Source record does not exist." });
      return;
    }

    res.status(200).json({ status: "success", data: { source } });
  } catch (error) {
    next(error);
  }
};

export const review: RequestHandler<{ id: string }, unknown, ReviewSourceInput> = async (req, res, next) => {
  try {
    const source = await reviewSource(req.params.id, req.body);
    res.status(200).json({ status: "success", data: { source } });
  } catch (error) {
    if (!sendSourceError(error, res)) next(error);
  }
};

export const changeConsent: RequestHandler<{ id: string }, unknown, ChangeSourceConsentInput> = async (req, res, next) => {
  try {
    const source = await changeSourceConsent(req.params.id, req.body);
    res.status(200).json({ status: "success", data: { source } });
  } catch (error) {
    if (!sendSourceError(error, res)) next(error);
  }
};
