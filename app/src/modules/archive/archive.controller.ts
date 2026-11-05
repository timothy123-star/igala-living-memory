import type { RequestHandler } from "express";

import { ArchiveSourceNotFoundError, getArchiveRecord } from "./archive.service.js";

export const getBySourceId: RequestHandler<{ sourceId: string }> = async (
  req,
  res,
  next
) => {
  try {
    const archive = await getArchiveRecord(req.params.sourceId);
    res.status(200).json({ status: "success", data: { archive } });
  } catch (error) {
    if (error instanceof ArchiveSourceNotFoundError) {
      res.status(404).json({ status: "fail", message: error.message });
      return;
    }

    next(error);
  }
};
