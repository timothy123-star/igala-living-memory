
import { Router } from "express";

import contributorRoutes from "../../modules/contributors/contributor.routes.js";
import consentRoutes from "../../modules/consent/consent.routes.js";
import sourceRoutes from "../../modules/source/source.routes.js";
import transcriptionRoutes from "../../modules/transcription/transcription.routes.js";
import interpretationRoutes from "../../modules/interpretation/interpretation.routes.js";
import archiveRoutes from "../../modules/archive/archive.routes.js";
import educationRoutes from "../../modules/education/education.routes.js";

const router = Router();

router.use("/contributors", contributorRoutes);
router.use("/consents", consentRoutes);
router.use("/sources", sourceRoutes);
router.use(archiveRoutes);
router.use(educationRoutes);
router.use(transcriptionRoutes);
router.use(interpretationRoutes);

export default router;
