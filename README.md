
# Igala Living Memory

An evidence-grounded Igala language and cultural preservation prototype for the Meta Global AI Developer Hackathon.

**Project status:** Early development. The Express backend and health-check endpoint are working. Meta Model API authentication has not yet been tested because the API key has not been configured.

## Project structure

```text
igala-living-memory/
├── app/                  # TypeScript backend
│   ├── src/
│   │   ├── server.ts
│   │   └── api-check.ts
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

- Node.js 20 or later
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

Health check:

```bash
curl http://localhost:3000/health
```

### Check TypeScript

```bash
npm run typecheck
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
