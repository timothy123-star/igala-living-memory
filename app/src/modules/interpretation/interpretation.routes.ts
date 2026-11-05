import { Router } from "express";

import * as interpretationController from "./interpretation.controller.js";
import {
  CreateInterpretationSchema,
  InterpretationIdParamsSchema,
  ReviewInterpretationSchema
} from "./interpretation.schema.js";
import {
  TranscriptionRouteParamsSchema
} from "../transcription/transcription.schema.js";
import {
  validateBody,
  validateParams
} from "../../shared/middleware/validate.js";

const router = Router();

router.post(
  "/transcriptions/:transcriptionId/interpretations",
  validateParams(TranscriptionRouteParamsSchema),
  validateBody(CreateInterpretationSchema),
  interpretationController.create
);
router.get(
  "/transcriptions/:transcriptionId/interpretations",
  validateParams(TranscriptionRouteParamsSchema),
  interpretationController.getForTranscription
);
router.get(
  "/interpretations/:id",
  validateParams(InterpretationIdParamsSchema),
  interpretationController.getById
);
router.post(
  "/interpretations/:id/verify",
  validateParams(InterpretationIdParamsSchema),
  validateBody(ReviewInterpretationSchema),
  interpretationController.verify
);

export default router;
