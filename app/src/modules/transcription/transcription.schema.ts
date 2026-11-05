import { z } from "zod";

export const TranscriptReviewStatusSchema = z.enum([
  "pending_review",
  "verified",
  "rejected"
]);

export const CreateTranscriptionSchema = z.strictObject({
  transcriberId: z.string().uuid(),
  consentId: z.string().uuid(),
  originalText: z.string().trim().min(1).max(20_000),
  language: z.literal("Igala"),
  transcriptionMethod: z.literal("human_entered")
});

export const ReviewTranscriptionSchema = z.strictObject({
  reviewerId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  reviewNote: z.string().trim().min(1).max(2_000).optional()
});

export const TranscriptionRecordSchema = z.strictObject({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  transcriberId: z.string().uuid(),
  consentId: z.string().uuid(),
  originalText: z.string().min(1),
  language: z.literal("Igala"),
  transcriptionMethod: z.literal("human_entered"),
  reviewStatus: TranscriptReviewStatusSchema,
  createdAt: z.iso.datetime(),
  reviewerId: z.string().uuid().nullable(),
  reviewNote: z.string().nullable(),
  verifiedAt: z.iso.datetime().nullable()
});

export const SourceIdParamsSchema = z.strictObject({
  sourceId: z.string().uuid()
});

export const TranscriptionIdParamsSchema = z.strictObject({
  id: z.string().uuid()
});

export const TranscriptionRouteParamsSchema = z.strictObject({
  transcriptionId: z.string().uuid()
});

export type CreateTranscriptionInput = z.infer<typeof CreateTranscriptionSchema>;
export type ReviewTranscriptionInput = z.infer<typeof ReviewTranscriptionSchema>;
export type TranscriptionRecord = z.infer<typeof TranscriptionRecordSchema>;
