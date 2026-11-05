import { z } from "zod";

export const SourceLanguageSchema = z.literal("Igala");

export const SourceReviewStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected"
]);

export const CreateSourceMetadataSchema = z.strictObject({
  contributorId: z.string().uuid(),
  consentId: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  context: z.string().trim().min(1).max(2_000).optional(),
  sourceLanguage: SourceLanguageSchema
});

export const SourceRecordSchema = z.strictObject({
  id: z.string().uuid(),
  contributorId: z.string().uuid(),
  consentId: z.string().uuid(),
  title: z.string().nullable(),
  context: z.string().nullable(),
  sourceLanguage: SourceLanguageSchema,
  mediaType: z.literal("audio"),
  storageKey: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  reviewStatus: SourceReviewStatusSchema,
  createdAt: z.iso.datetime(),
  reviewerId: z.string().uuid().nullable(),
  reviewNote: z.string().nullable(),
  verifiedAt: z.iso.datetime().nullable()
});

export const ReviewSourceSchema = z.strictObject({
  reviewerId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().min(1).max(2_000)
});

export const ChangeSourceConsentSchema = z.strictObject({
  consentId: z.string().uuid()
});

export const SourceIdParamsSchema = z.strictObject({
  id: z.string().uuid()
});

export type CreateSourceMetadata = z.infer<typeof CreateSourceMetadataSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type ReviewSourceInput = z.infer<typeof ReviewSourceSchema>;
export type ChangeSourceConsentInput = z.infer<typeof ChangeSourceConsentSchema>;
