import type { RequestHandler } from "express";

import { ArchiveSourceNotFoundError } from "../archive/archive.service.js";
import type { CreateEducationalContentInput } from "./education.schema.js";
import {
  createGroundedEducationalContent,
  InsufficientArchiveEvidenceError
} from "./education.service.js";

export const create: RequestHandler<
  { sourceId: string },
  unknown,
  CreateEducationalContentInput
> = async (req, res, next) => {
  try {
    const result = await createGroundedEducationalContent(req.params.sourceId, req.body);
    res.status(200).json({
      status: "success",
      data: {
        lesson: result.lesson,
        model: result.model,
        usage: result.usage,
        humanVerified: result.humanVerified,
        sourceReferences: result.sourceReferences
      }
    });
  } catch (error) {
    if (error instanceof ArchiveSourceNotFoundError) {
      res.status(404).json({ status: "fail", message: error.message });
      return;
    }

    if (error instanceof InsufficientArchiveEvidenceError) {
      res.status(409).json({
        status: "insufficient_evidence",
        message: error.message,
        reasons: error.reasons
      });
      return;
    }

    next(error);
  }
};
