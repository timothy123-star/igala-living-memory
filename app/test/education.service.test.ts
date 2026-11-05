import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { getArchiveRecord, getEducationalEligibility, type ArchiveRecord } from "../src/modules/archive/archive.service.js";
import { closeDatabase, getDatabase, initializeDatabase } from "../src/shared/database/database.js";
import {
  createGroundedEducationalContentForArchive,
  InsufficientArchiveEvidenceError
} from "../src/modules/education/education.service.js";

const sourceId = "ad1e919e-3ffb-42bd-9368-6c3d5db48dd1";
const mockLesson = JSON.stringify({
  title: "Grounded lesson",
  learningObjectives: ["Use the approved passage."],
  explanation: "This lesson uses only the approved archive evidence.",
  proverbActivities: [{
    igala: "Approved Igala archive passage.",
    interpretation: "Approved English archive interpretation.",
    activity: "Compare the paired archive texts."
  }],
  vocabularyExercises: [],
  comprehensionQuestions: [{ question: "What evidence is available?", answer: "The approved passage." }],
  quizQuestions: [{ question: "Is this human-verified?", answer: "No; it is AI-generated." }],
  evidenceStatement: "Grounded in the approved archive pair."
});

before(() => initializeDatabase());
after(() => closeDatabase());

test("an ineligible archive fixture refuses generation without calling a model or mutating records", async () => {
  const beforeRows = getDatabase().prepare(`
    SELECT
      (SELECT COUNT(*) FROM contributors) AS contributors,
      (SELECT COUNT(*) FROM consents) AS consents,
      (SELECT COUNT(*) FROM sources) AS sources,
      (SELECT COUNT(*) FROM transcriptions) AS transcriptions,
      (SELECT COUNT(*) FROM interpretations) AS interpretations
  `).get();
  const archive = await getArchiveRecord(sourceId);
  const ineligibleArchive = {
    ...archive,
    source: { ...archive.source, reviewStatus: "pending_review" as const },
    consent: {
      ...archive.consent,
      permissions: archive.consent.permissions.filter((permission) =>
        permission.purpose !== "ai_processing" && permission.purpose !== "educational_publication"
      )
    }
  };
  let modelCalls = 0;

  await assert.rejects(
    () => createGroundedEducationalContentForArchive(
      ineligibleArchive,
      { prompt: "Create a learner exercise." },
      async () => {
        modelCalls += 1;
        return { text: "unexpected", model: "mock", usage: null };
      }
    ),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientArchiveEvidenceError);
      assert.deepEqual(error.reasons, [
        "The source audio has not been approved for archive use.",
        "Consent does not grant AI processing.",
        "Consent does not grant educational publication."
      ]);
      return true;
    }
  );

  assert.equal(modelCalls, 0);
  assert.deepEqual(getDatabase().prepare(`
    SELECT
      (SELECT COUNT(*) FROM contributors) AS contributors,
      (SELECT COUNT(*) FROM consents) AS consents,
      (SELECT COUNT(*) FROM sources) AS sources,
      (SELECT COUNT(*) FROM transcriptions) AS transcriptions,
      (SELECT COUNT(*) FROM interpretations) AS interpretations
  `).get(), beforeRows);
});

test("eligible isolated fixture grounds output, returns references, and marks it unverified", async () => {
  const fixture = {
    source: { id: "11111111-1111-4111-8111-111111111111", reviewStatus: "approved" },
    consent: {
      status: "active",
      permissions: [
        { purpose: "ai_processing", granted: true },
        { purpose: "educational_publication", granted: true }
      ]
    },
    transcriptions: [{
      record: {
        id: "22222222-2222-4222-8222-222222222222",
        reviewStatus: "verified",
        originalText: "Approved Igala archive passage."
      },
      interpretations: [{
        record: {
          id: "33333333-3333-4333-8333-333333333333",
          reviewStatus: "verified",
          interpretationText: "Approved English archive interpretation."
        }
      }]
    }]
  } as ArchiveRecord;
  let capturedPrompt = "";

  const result = await createGroundedEducationalContentForArchive(
    fixture,
    { prompt: "Create a learner exercise from the approved passage." },
    async (prompt) => {
      capturedPrompt = prompt;
        return { text: mockLesson, model: "mock-muse", usage: null };
    }
  );

  assert.match(capturedPrompt, /Approved Igala archive passage/);
  assert.match(capturedPrompt, /Approved English archive interpretation/);
  assert.match(capturedPrompt, /Insufficient archive evidence to answer this request/);
  assert.deepEqual(result.sourceReferences, [{
    sourceId: "11111111-1111-4111-8111-111111111111",
    transcriptionId: "22222222-2222-4222-8222-222222222222",
    interpretationId: "33333333-3333-4333-8333-333333333333"
  }]);
  assert.equal(result.humanVerified, false);
  assert.equal(result.lesson.title, "Grounded lesson");
});

test("eligible fixture preserves an explicit lack-of-evidence answer for an unsupported question", async () => {
  const fixture = {
    source: { id: "44444444-4444-4444-8444-444444444444", reviewStatus: "approved" },
    consent: {
      status: "active",
      permissions: [
        { purpose: "ai_processing", granted: true },
        { purpose: "educational_publication", granted: true }
      ]
    },
    transcriptions: [{
      record: {
        id: "55555555-5555-4555-8555-555555555555",
        reviewStatus: "verified",
        originalText: "Only this approved passage is available."
      },
      interpretations: [{
        record: {
          id: "66666666-6666-4666-8666-666666666666",
          reviewStatus: "verified",
          interpretationText: "Only this approved interpretation is available."
        }
      }]
    }]
  } as ArchiveRecord;
  const lackOfEvidence = "Insufficient archive evidence to answer this request.";
  const lackOfEvidenceLesson = JSON.stringify({
    title: "Evidence unavailable",
    learningObjectives: ["Recognize archive boundaries."],
    explanation: lackOfEvidence,
    proverbActivities: [{
      igala: "Only this approved passage is available.",
      interpretation: "Only this approved interpretation is available.",
      activity: "Read the available pair."
    }],
    vocabularyExercises: [],
    comprehensionQuestions: [{ question: "What is unavailable?", answer: lackOfEvidence }],
    quizQuestions: [{ question: "Can this be answered?", answer: lackOfEvidence }],
    evidenceStatement: "Only the listed archive pair is available."
  });

  const result = await createGroundedEducationalContentForArchive(
    fixture,
    { prompt: "What information exists outside this passage?" },
    async () => ({ text: lackOfEvidenceLesson, model: "mock-muse", usage: null })
  );

  assert.equal(result.lesson.explanation, lackOfEvidence);
  assert.equal(result.humanVerified, false);
  assert.equal(result.sourceReferences.length, 1);
});

test("the current archive is eligible after the documented consent extension and source approval", async () => {
  const archive = await getArchiveRecord(sourceId);
  assert.deepEqual(getEducationalEligibility(archive), { eligible: true, reasons: [] });
});
