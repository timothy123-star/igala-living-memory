import { z } from "zod";

export const InterpretationReviewStatusSchema = z.enum([
  "pending_review",
  "verified",
  "rejected"
]);

export const CreateInterpretationSchema = z.strictObject({
  interpretationText: z.string().trim().min(1).max(20_000),
  sourceLanguage: z.literal("Igala"),
  targetLanguage: z.literal("English"),
  translatorId: z.string().uuid(),
  consentId: z.string().uuid()
});

export const ReviewInterpretationSchema = z.strictObject({
  reviewerId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  reviewNote: z.string().trim().min(1).max(2_000).optional()
});

export const InterpretationRecordSchema = z.strictObject({
  id: z.string().uuid(),
  transcriptionId: z.string().uuid(),
  interpretationText: z.string().min(1),
  sourceLanguage: z.literal("Igala"),
  targetLanguage: z.literal("English"),
  translatorId: z.string().uuid(),
  consentId: z.string().uuid(),
  reviewStatus: InterpretationReviewStatusSchema,
  createdAt: z.iso.datetime(),
  reviewerId: z.string().uuid().nullable(),
  reviewNote: z.string().nullable(),
  verifiedAt: z.iso.datetime().nullable()
});

export const InterpretationIdParamsSchema = z.strictObject({
  id: z.string().uuid()
});

export type CreateInterpretationInput = z.infer<typeof CreateInterpretationSchema>;
export type ReviewInterpretationInput = z.infer<typeof ReviewInterpretationSchema>;
export type InterpretationRecord = z.infer<typeof InterpretationRecordSchema>;
