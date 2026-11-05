
import { z } from "zod";

// Roles a person can perform in the project.
export const ContributorRoleSchema = z.enum([
  "speaker",
  "transcriber",
  "translator",
  "reviewer"
]);

// What the client is allowed to submit when creating a contributor.
export const CreateContributorSchema = z.strictObject({
  publicLabel: z.string().trim().min(1).max(100),

  roles: z.array(ContributorRoleSchema).min(1).max(4),

  preferredLanguage: z.string().trim().min(2).max(50)
});

// The complete contributor record, including server-generated fields.
export const ContributorSchema = CreateContributorSchema.extend({
  id: z.string().uuid(),

  createdAt: z.iso.datetime()
});

// TypeScript types derived from our schemas.
export type CreateContributorInput =
  z.infer<typeof CreateContributorSchema>;

export type Contributor =
  z.infer<typeof ContributorSchema>;

export type ContributorRole =
  z.infer<typeof ContributorRoleSchema>;
