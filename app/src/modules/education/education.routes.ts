import { Router } from "express";

import * as educationController from "./education.controller.js";
import { SourceIdParamsSchema } from "../transcription/transcription.schema.js";
import { CreateEducationalContentSchema } from "./education.schema.js";
import { validateBody, validateParams } from "../../shared/middleware/validate.js";

const router = Router();

router.post(
  "/sources/:sourceId/educational-content",
  validateParams(SourceIdParamsSchema),
  validateBody(CreateEducationalContentSchema),
  educationController.create
);

export default router;
