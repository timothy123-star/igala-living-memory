import { Router } from "express";

import * as transcriptionController from "./transcription.controller.js";
import {
  CreateTranscriptionSchema,
  ReviewTranscriptionSchema,
  SourceIdParamsSchema,
  TranscriptionIdParamsSchema
} from "./transcription.schema.js";
import {
  validateBody,
  validateParams
} from "../../shared/middleware/validate.js";

const router = Router();

router.post(
  "/sources/:sourceId/transcriptions",
  validateParams(SourceIdParamsSchema),
  validateBody(CreateTranscriptionSchema),
  transcriptionController.create
);
router.get(
  "/sources/:sourceId/transcriptions",
  validateParams(SourceIdParamsSchema),
  transcriptionController.getForSource
);
router.get(
  "/transcriptions/:id",
  validateParams(TranscriptionIdParamsSchema),
  transcriptionController.getById
);
router.post(
  "/transcriptions/:id/verify",
  validateParams(TranscriptionIdParamsSchema),
  validateBody(ReviewTranscriptionSchema),
  transcriptionController.verify
);

export default router;
