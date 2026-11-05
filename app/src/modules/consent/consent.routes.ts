import { Router } from "express";

import * as consentController from "./consent.controller.js";
import {
  ConsentEligibilityQuerySchema,
  ConsentIdParamsSchema,
  CreateConsentSchema
} from "./consent.schema.js";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../../shared/middleware/validate.js";

const router = Router();

router.post(
  "/",
  validateBody(CreateConsentSchema),
  consentController.create
);

router.post(
  "/:id/withdraw",
  validateParams(ConsentIdParamsSchema),
  consentController.withdraw
);

router.get(
  "/:id/eligibility",
  validateParams(ConsentIdParamsSchema),
  validateQuery(ConsentEligibilityQuerySchema),
  consentController.checkEligibility
);

export default router;
