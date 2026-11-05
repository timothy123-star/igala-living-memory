import assert from "node:assert/strict";
import test from "node:test";

import { ConsentEligibilityQuerySchema, CreateConsentSchema } from "../src/modules/consent/consent.schema.js";
import { CreateEducationalContentSchema } from "../src/modules/education/education.schema.js";
import { CreateSourceMetadataSchema } from "../src/modules/source/source.schema.js";

test("source upload metadata accepts only an Igala source with UUID references", () => {
  const valid = CreateSourceMetadataSchema.safeParse({
    contributorId: "88e873ee-c34c-4cc2-a435-0e36832bf3d4",
    consentId: "07633494-de7d-42eb-bf59-4d57540590fb",
    sourceLanguage: "Igala"
  });

  assert.equal(valid.success, true);
  assert.equal(CreateSourceMetadataSchema.safeParse({
    contributorId: "not-a-uuid",
    consentId: "07633494-de7d-42eb-bf59-4d57540590fb",
    sourceLanguage: "English"
  }).success, false);
});

test("consent validation rejects duplicated purposes and unknown eligibility fields", () => {
  assert.equal(CreateConsentSchema.safeParse({
    contributorId: "88e873ee-c34c-4cc2-a435-0e36832bf3d4",
    permissions: [
      { purpose: "recording", granted: true },
      { purpose: "recording", granted: false }
    ],
    consentMethod: "written",
    consentVersion: "v1",
    evidenceReference: null
  }).success, false);

  assert.equal(ConsentEligibilityQuerySchema.safeParse({
    contributorId: "88e873ee-c34c-4cc2-a435-0e36832bf3d4",
    purpose: "storage",
    extra: true
  }).success, false);
});

test("educational requests require a non-empty bounded prompt", () => {
  assert.equal(CreateEducationalContentSchema.safeParse({ prompt: "" }).success, false);
  assert.equal(CreateEducationalContentSchema.safeParse({ prompt: "Create one exercise." }).success, true);
});
