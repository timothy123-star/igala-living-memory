
# Igala Living Memory

An evidence-grounded Igala language and cultural preservation prototype for the Meta Global AI Developer Hackathon.

**Project status:** Demonstrable API MVP. The archive preserves provenance, consent and human-review records; educational AI requests are blocked unless the archive has approved material and the required permissions.

## Project structure

```text
igala-living-memory/
├── app/                  # TypeScript backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── modules/       # Consent, archive, transcription and interpretation workflow
│   │   └── services/meta/ # Existing Meta Muse Spark integration
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── data/                 # Local source materials; not committed
├── docs/                 # Project documentation
├── evaluation/            # Python evaluation tools
├── tests/                # Project tests
├── .gitignore
├── .venv/                # Python virtual environment; not committed
└── README.md
```

## Requirements

- Node.js 24 or later (the API uses the built-in `node:sqlite` module)
- npm
- Python 3.10 or later
- A Meta Model API account and API key for model connectivity testing

## TypeScript backend setup

From the repository root:

```bash
cd app
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Edit `app/.env` and add your API key:

```env
MODEL_API_KEY=YOUR_ACTUAL_API_KEY
META_MODEL=muse-spark-1.3
```

Never commit `.env`, paste your API key into chats, or expose it in browser-side code.

### Run the backend

From the `app/` directory:

```bash
npm run dev
```

The server starts at:

```text
http://localhost:3000
```

### Open the judge-facing demo

With the API running, open [http://localhost:3000](http://localhost:3000). The responsive frontend is served by Express and loads the live archive record through the same API. It never displays a raw-audio link or player unless consent permits public distribution.

The **Generate with Muse Spark** panel calls the guarded learning endpoint. The included source is approved and has a written consent extension for AI processing and educational publication, so it can produce a source-referenced lesson. Generated material remains explicitly AI-generated and not human-verified.

Health check:

```bash
curl http://localhost:3000/health
```

### Check TypeScript

```bash
npm run typecheck
```

### Run automated tests

```bash
npm test
```

### Test Meta Model API connectivity

After configuring the API key:

```bash
npm run api:check
```

This test sends a small request to the configured Meta model. It may incur API usage or consume credits.

## Python environment

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

Reactivate the environment in a later terminal session:

```bash
source .venv/bin/activate
```

Deactivate it with:

```bash
deactivate
```

Python dependencies and evaluation tooling will be documented separately as they are introduced.

## Product workflow

1. Obtain informed consent before recording or collecting contributions.
2. Preserve original recordings and source provenance under appropriate access controls.
3. Transcribe Igala speech and obtain fluent-speaker review.
4. Keep transcripts, translations, interpretations, and verification records distinct.
5. Make only approved, appropriately licensed passages available for AI retrieval.
6. Generate lessons and quizzes grounded in those approved passages.
7. Show source references and refuse to invent answers when the archive does not contain sufficient evidence.
8. Evaluate generated content against a speaker-verified test set.

## Product invariant

AI-generated material is a draft, not ground truth.

No generated learning material should be published unless its cited passages exist, are approved for the intended use, and have valid consent and permissions.

Community contributors must retain appropriate control over their contributions. Public access, reuse, and model-training permissions must not be assumed from consent to record.

## Official API documentation

- [Meta Model API Quickstart](https://dev.meta.ai/docs/quickstart)
- [Meta Model API Reference](https://dev.meta.ai/docs/api-reference)

## MVP architecture and workflow

The API uses Express 5, TypeScript, Zod request validation, and SQLite through Node's built-in `node:sqlite` module. Original audio stays in `data/raw/`; SQLite stores its storage key, MIME type, size, and SHA-256 checksum rather than audio bytes.

```text
consented audio upload -> private raw storage + source metadata
  -> human-entered Igala transcription -> attributed human review
  -> English interpretation -> attributed human review
  -> provenance view -> guarded AI educational request
```

`GET /api/v1/sources/:sourceId/archive` provides one read-only display payload containing source-audio metadata, contributor attribution, consent state, human-entered Igala transcription, English interpretation, review status, reviewer attribution, and review notes. It never exposes raw audio unless the consent explicitly grants `public_audio_distribution`.

`POST /api/v1/sources/:sourceId/educational-content` uses the existing Meta Muse Spark service only when the source is approved, a verified transcription and interpretation exist, and active consent grants both `ai_processing` and `educational_publication`. Otherwise it returns `409 insufficient_evidence` and does not call the model. Any model output is returned with `humanVerified: false`.

## Demo

With the server running, use the existing source record:

```bash
SOURCE_ID=ad1e919e-3ffb-42bd-9368-6c3d5db48dd1

curl http://localhost:3000/api/v1/sources/$SOURCE_ID/archive

curl -X POST http://localhost:3000/api/v1/sources/$SOURCE_ID/educational-content \
  -H 'content-type: application/json' \
  -d '{"prompt":"Make a learner exercise from this source."}'
```

The current source is approved and has active written consent for AI processing and educational publication. A real Muse Spark generation has been verified against it. Its Igala transcription was supplied and confirmed by the project owner. Its English interpretation is caption-aligned to the source video and is not claimed to be an independent translation from the audio.

## Current limitations

This hackathon MVP is API-only. It does not yet have authentication or role-based access control, a browser UI, public raw-audio playback, or a retention/deletion workflow. Do not treat its AI output as human verification or as a replacement for community review.
