import type { RequestHandler, Response } from "express";

import type {
  CreateTranscriptionInput,
  ReviewTranscriptionInput
} from "./transcription.schema.js";
import {
  ConsentInactiveError,
  ConsentNotFoundError,
  ConsentPermissionDeniedError,
  ContributorNotFoundError,
  ContributorRoleError,
  createTranscription,
  getTranscriptionById,
  getTranscriptionsForSource,
  InvalidTranscriptionTransitionError,
  SourceNotFoundError,
  TranscriptionNotFoundError,
  verifyTranscription
} from "./transcription.service.js";

function sendTranscriptionError(error: unknown, res: Response): boolean {
  if (error instanceof SourceNotFoundError || error instanceof TranscriptionNotFoundError || error instanceof ContributorNotFoundError || error instanceof ConsentNotFoundError) {
    res.status(404).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentPermissionDeniedError || error instanceof ContributorRoleError) {
    res.status(403).json({ status: "fail", message: error.message });
    return true;
  }

  if (error instanceof ConsentInactiveError || error instanceof InvalidTranscriptionTransitionError) {
    res.status(409).json({ status: "fail", message: error.message });
    return true;
  }

  return false;
}

export const create: RequestHandler<
  { sourceId: string },
  unknown,
  CreateTranscriptionInput
> = async (req, res, next) => {
  try {
    const transcription = await createTranscription(req.params.sourceId, req.body);
    res.status(201).json({ status: "success", data: { transcription } });
  } catch (error) {
    if (!sendTranscriptionError(error, res)) next(error);
  }
};

export const getForSource: RequestHandler<{ sourceId: string }> = async (req, res, next) => {
  try {
    const transcriptions = await getTranscriptionsForSource(req.params.sourceId);
    res.status(200).json({
      status: "success",
      results: transcriptions.length,
      data: { transcriptions }
    });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const transcription = await getTranscriptionById(req.params.id);

    if (!transcription) {
      res.status(404).json({ status: "fail", message: "Transcription record does not exist." });
      return;
    }

    res.status(200).json({ status: "success", data: { transcription } });
  } catch (error) {
    next(error);
  }
};

export const verify: RequestHandler<
  { id: string },
  unknown,
  ReviewTranscriptionInput
> = async (req, res, next) => {
  try {
    const transcription = await verifyTranscription(req.params.id, req.body);
    res.status(200).json({ status: "success", data: { transcription } });
  } catch (error) {
    if (!sendTranscriptionError(error, res)) next(error);
  }
};
