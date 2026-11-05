import { Router } from "express";

import * as archiveController from "./archive.controller.js";
import { SourceIdParamsSchema } from "../transcription/transcription.schema.js";
import { validateParams } from "../../shared/middleware/validate.js";

const router = Router();

router.get(
  "/sources/:sourceId/archive",
  validateParams(SourceIdParamsSchema),
  archiveController.getBySourceId
);

export default router;
