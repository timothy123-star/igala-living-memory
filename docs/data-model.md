
# Igala Living Memory — Knowledge Source Data Model

## 1. Purpose

This document defines how Igala Living Memory represents and manages community-contributed language and cultural knowledge.

The system must preserve the distinction between original contributions, transcriptions, translations, human verification, approved knowledge passages, and AI-generated learning material.

## 2. Core entities

### Contributor
Represents a person who contributes a recording, transcription, translation, or review.

A contributor is identified internally by a unique ID. The learner-facing system should use a public pseudonymous label unless the contributor explicitly authorizes attribution.

### ConsentRecord
Records the permissions granted by a contributor.

Permissions must distinguish:
- Audio recording and storage
- Transcription and translation
- Human review
- AI processing
- Educational publication
- Public audio distribution
- Model training

Consent records must be versioned and revocation must be recorded.

### Recording
Represents an original audio contribution.

The database stores its private storage reference and metadata, not the audio bytes.

Every recording must reference its contributor and applicable consent record.

### Transcript
Represents a versioned transcription of a recording.

Original transcript versions must not be overwritten. Changes create new versions.

### Translation
Represents a versioned interpretation of a transcript in another language.

Translations are distinct from the original Igala transcript and must have their own review status.

### Review
Records a human review decision against an exact version of a transcript, translation, or knowledge passage.

Review decisions include approved, rejected, and needs_revision.

### KnowledgePassage
Represents a source-grounded portion of approved material.

Every passage must reference its source transcript version and, where available, its source translation version.

### LearningArtifact
Represents an AI-assisted lesson, vocabulary item, or quiz question.

Every published artifact must reference the knowledge passages that support it.

## 3. Relationships

- A contributor can have multiple consent records.
- A contributor can provide multiple recordings.
- Each recording references an applicable consent record.
- A recording can have multiple transcript versions.
- A transcript version can have multiple translation versions.
- An artifact can have multiple review records.
- A transcript can produce multiple knowledge passages.
- A knowledge passage can support multiple learning artifacts.
- A learning artifact can reference multiple knowledge passages.

## 4. Verification states

Transcript and translation workflow:

draft -> pending_review -> approved

Alternative outcomes:
- rejected
- needs_revision
- superseded

Knowledge passage workflow:

draft -> pending_review -> approved -> retired

Learning artifact workflow:

draft -> pending_review -> published

Alternative outcomes:
- rejected
- withdrawn

Approval of an earlier version must never automatically approve a later version.

## 5. Retrieval eligibility

A knowledge passage is eligible for AI retrieval only when:

1. Its source material exists.
2. The relevant transcript and translation versions have the required human approval.
3. The applicable consent is valid and has not been revoked.
4. The consent permits the intended processing.
5. The source is authorized for the requested educational use.

Eligibility must be checked when retrieving material, not assumed from a permanently stored approval flag.

## 6. Data protection

- Original recordings are private by default.
- Contributor contact information is separated from public attribution data.
- Raw recordings and source datasets are excluded from Git.
- API credentials remain in backend environment variables.
- AI processing and model-training permissions are separate.
- Consent withdrawal must trigger a review of future use and existing stored copies under the project's retention and deletion policy.

## 7. Product invariant

An AI-generated answer is not ground truth.

A published learning artifact must have traceable supporting passages, valid permissions, and the required human approval.

No Igala language or cultural information should be invented and presented as verified community knowledge.
