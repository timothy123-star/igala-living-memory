import type { ErrorRequestHandler } from "express";
import { Router } from "express";
import multer from "multer";

import * as sourceController from "./source.controller.js";
import {
  CreateSourceMetadataSchema,
  ChangeSourceConsentSchema,
  ReviewSourceSchema,
  SourceIdParamsSchema
} from "./source.schema.js";
import { isSupportedAudioMimeType } from "./source.service.js";
import {
  validateBody,
  validateParams
} from "../../shared/middleware/validate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!isSupportedAudioMimeType(file.mimetype)) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "audio"));
      return;
    }

    callback(null, true);
  }
});

const handleUploadError: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Audio uploads must not exceed 25 MB."
      : "Upload one supported audio file in the audio field.";

    res.status(400).json({ status: "fail", message });
    return;
  }

  next(error);
};

const router = Router();

router.post(
  "/",
  upload.single("audio"),
  handleUploadError,
  validateBody(CreateSourceMetadataSchema),
  sourceController.create
);
router.post(
  "/:id/consent",
  validateParams(SourceIdParamsSchema),
  validateBody(ChangeSourceConsentSchema),
  sourceController.changeConsent
);
router.get("/", sourceController.getAll);
router.get(
  "/:id",
  validateParams(SourceIdParamsSchema),
  sourceController.getById
);
router.post(
  "/:id/review",
  validateParams(SourceIdParamsSchema),
  validateBody(ReviewSourceSchema),
  sourceController.review
);

export default router;
