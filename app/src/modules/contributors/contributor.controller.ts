
import type { RequestHandler } from "express";

import type { CreateContributorInput } from "./contributor.schema.js";

import {
  createContributor,
  getContributors
} from "./contributor.service.js";

export const create: RequestHandler<
  Record<string, never>,
  unknown,
  CreateContributorInput
> = async (req, res, next) => {

  try {
    const contributor = await createContributor(req.body);

    res.status(201).json({
      status: "success",
      data: {
        contributor
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getAll: RequestHandler = async (_req, res, next) => {

  try {
    const contributors = await getContributors();

    res.status(200).json({
      status: "success",
      results: contributors.length,
      data: {
        contributors
      }
    });

  } catch (error) {
    next(error);
  }
};
