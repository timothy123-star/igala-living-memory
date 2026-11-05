
import { z } from "zod";

export const ConsentPurposeSchema = z.enum([
  "recording",
  "storage",
  "transcription",
  "translation",
  "human_review",
  "ai_processing",
  "educational_publication",
  "public_audio_distribution",
  "model_training"
]);

export const ConsentStatusSchema = z.enum([
  "active",
  "withdrawn",
  "expired"
]);

export const ConsentPermissionSchema = z.strictObject({
  purpose: ConsentPurposeSchema,
  granted: z.boolean()
});

export const CreateConsentSchema = z.strictObject({
  contributorId: z.string().uuid(),
  permissions: z.array(ConsentPermissionSchema).min(1),
  consentMethod: z.enum([
    "written",
    "audio_recorded",
    "witnessed"
  ]),
  consentVersion: z.string().trim().min(1).max(100),
  evidenceReference: z.string().trim().min(1).max(500).nullable()
}).superRefine((consent, context) => {
  const purposes = new Set<string>();

  consent.permissions.forEach((permission, index) => {
    if (purposes.has(permission.purpose)) {
      context.addIssue({
        code: "custom",
        path: ["permissions", index, "purpose"],
        message: "Each consent purpose may appear only once."
      });
    }

    purposes.add(permission.purpose);
  });
});

export const ConsentRecordSchema = z.strictObject({
  id: z.string().uuid(),
  contributorId: z.string().uuid(),
  permissions: z.array(ConsentPermissionSchema).min(1),
  status: ConsentStatusSchema,
  consentMethod: z.enum([
    "written",
    "audio_recorded",
    "witnessed"
  ]),
  consentVersion: z.string().trim().min(1).max(100),
  grantedAt: z.iso.datetime(),
  withdrawnAt: z.iso.datetime().nullable(),
  evidenceReference: z.string().trim().min(1).max(500).nullable()
});

export const ConsentIdParamsSchema = z.strictObject({
  id: z.string().uuid()
});

export const ConsentEligibilityQuerySchema = z.strictObject({
  contributorId: z.string().uuid(),
  purpose: ConsentPurposeSchema
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
export type ConsentPurpose = z.infer<typeof ConsentPurposeSchema>;
export type CreateConsentInput = z.infer<typeof CreateConsentSchema>;
export type ConsentEligibilityQuery = z.infer<
  typeof ConsentEligibilityQuerySchema
>;
