import type { RequestHandler, Response } from "express";

import type {
  CreateInterpretationInput,
  ReviewInterpretationInput
} from "./interpretation.schema.js";
import {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  ContributorRoleError,
  createInterpretation,
  getInterpretationById,
  getInterpretationsForTranscription,
  InterpretationNotFoundError,
  InvalidInterpretationTransitionError,
  SourceNotFoundError,
  TranscriptionNotFoundError,
  verifyInterpretation
} from "./interpretation.service.js";

function sendInterpretationError(error: unknown, res: Response): boolean {
  if (error instanceof InterpretationNotFoundError || error instanceof TranscriptionNotFoundError || error instanceof SourceNotFoundError || error instanceof ContributorNotFoundError || error instanceof ConsentNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentPermissionDeniedError || error instanceof ContributorRoleError) {
    res.status(403).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentInactiveError || error instanceof InvalidInterpretationTransitionError) {
    res.status(409).json({ status: "fail", message: error.message });
    return true;
  }

  return false;
}

export const create: RequestHandler<
  { transcriptionId: string },
  unknown,
  CreateInterpretationInput
> = async (req, res, next) => {
  try {
    const interpretation = await createInterpretation(
      req.params.transcriptionId,
      req.body
    );
    res.status(201).json({ status: "success", data: { interpretation } });
  } catch (error) {
    if (!sendInterpretationError(error, res)) next(error);
  }
};

export const getForTranscription: RequestHandler<{ transcriptionId: string }> = async (req, res, next) => {
  try {
    const interpretations = await getInterpretationsForTranscription(
      req.params.transcriptionId
    );
    res.status(200).json({
      status: "success",
      results: interpretations.length,
      data: { interpretations }
    });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const interpretation = await getInterpretationById(req.params.id);

    if (!interpretation) {
      res.status(404).json({ status: "fail", message: "Interpretation record does not exist." });
      return;
    }

    res.status(200).json({ status: "success", data: { interpretation } });
  } catch (error) {
    next(error);
  }
};

export const verify: RequestHandler<
  { id: string },
  unknown,
  ReviewInterpretationInput
> = async (req, res, next) => {
  try {
    const interpretation = await verifyInterpretation(req.params.id, req.body);
    res.status(200).json({ status: "success", data: { interpretation } });
  } catch (error) {
    if (!sendInterpretationError(error, res)) next(error);
  }
};
