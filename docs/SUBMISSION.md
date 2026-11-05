# Igala Living Memory

## Project description

Igala Living Memory is a consent-first archive prototype for preserving Igala oral language material. It connects original contributed audio to human-entered text, caption-aligned interpretation, attribution, consent, and review decisions so that cultural knowledge remains traceable to its community context.

## Problem

Endangered-language and oral-knowledge projects often risk separating a recording from the people who contributed it, the terms under which it was shared, and the human review needed to interpret it responsibly. Generic AI can make this worse by sounding authoritative when an archive has insufficient evidence.

## Solution

The project provides a live archive view for a real consented contribution. It displays source provenance, contributor roles, consent scope, the human-confirmed Igala transcription, caption-aligned English interpretation, and reviewer notes. Original audio stays private unless consent expressly permits public distribution.

## Architecture

- Express 5 and TypeScript API
- SQLite via Node `node:sqlite`
- Zod-validated API inputs
- Private raw-audio storage with SHA-256 metadata
- Contributor, consent, source, transcription, interpretation, and reviewer records linked by foreign keys
- Static responsive frontend served by the existing Express app

## Meta Muse Spark integration

The existing Muse Spark-compatible Meta API client remains server-side. The learning-material endpoint checks that source material is approved, transcription and interpretation are human-verified, and active consent explicitly grants `ai_processing` and `educational_publication` before calling the model. Successful output includes source references and is always marked `humanVerified: false`.

The demonstrated contribution is approved and has a documented written consent extension for AI processing and educational publication. A real Muse Spark lesson was generated from the first archived proverb. The returned lesson preserved the Igala transcription/caption-aligned-English distinction, included three comprehension questions and answers, omitted unsupported vocabulary claims, cited transcription `32b3125f-cbb0-46f9-9ad1-6a19017412af` and interpretation `29be6933-1b69-4116-bb51-4e634e704f11`, and was marked `humanVerified: false`.

## Safeguards

- Purpose-specific, revocable consent
- No public audio playback without `public_audio_distribution` permission
- Human attribution, review notes, and verification timestamps kept with each record
- Clear distinction between human-confirmed Igala transcription and video-caption-aligned English interpretation
- Refusal when archive evidence, approval, or consent is insufficient
- No invented cultural facts or claims that AI output is human-verified

## Current limitations

This hackathon MVP has no authentication, role-based access control, browser recording interface, retention/deletion workflow, or public audio playback. The frontend demonstrates the actual single archive record and API workflow, not a production access-control boundary.

## Demo instructions

```bash
cd app
npm install
cp .env.example .env # only if app/.env has not already been configured
npm run dev
```

Open `http://localhost:3000`. The landing page fetches the live archive data from `/api/v1/sources/ad1e919e-3ffb-42bd-9368-6c3d5db48dd1/archive`. Select **Generate with Muse Spark** to create a real, source-referenced lesson from the approved contribution.

Run checks with `npm run typecheck`, `npm test`, and optionally `npm run api:check` when valid Meta credentials are configured. The latter sends a real network request and may consume API credits.
