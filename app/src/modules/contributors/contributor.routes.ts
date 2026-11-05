
import { Router } from "express";

import * as contributorController from "./contributor.controller.js";

import { CreateContributorSchema } from "./contributor.schema.js";

import { validateBody } from "../../shared/middleware/validate.js";

const router = Router();

// GET /api/v1/contributors
router.get("/", contributorController.getAll);

// POST /api/v1/contributors
router.post(
  "/",
  validateBody(CreateContributorSchema),
  contributorController.create
);

export default router;
