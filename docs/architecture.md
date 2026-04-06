# Architecture

## System Summary

Debug Quest is a split frontend/backend application where the browser handles navigation and code editing, the Express API owns business rules and persistence, MongoDB stores state, and an external execution service evaluates code behavior.

At a high level, the system is organized around one product loop:

1. deliver a buggy coding challenge,
2. let the learner edit locally in the browser,
3. validate the fix by executing code remotely,
4. translate the result into points, penalties, and progress signals.

## Module Map

### Client

Primary responsibilities:

- route handling and lazy loading,
- authentication flows,
- challenge browsing and question detail rendering,
- code editor experience,
- leaderboard and admin views,
- API orchestration and session handling.

Key areas:

- `client/src/components/Root.jsx`: top-level route composition.
- `client/src/pages/Challenges.jsx`: main challenge entry surface.
- `client/src/pages/QuestionsList.jsx`: difficulty-filtered question discovery.
- `client/src/pages/QuestionDetail.jsx`: challenge solving workflow.
- `client/src/components/BuggyCodeGenerator.jsx`: AI challenge generation UI.
- `client/src/config/api.js`: environment-aware API base selection.

### Server

Primary responsibilities:

- authentication and authorization,
- question retrieval and submission evaluation,
- AI challenge generation,
- leaderboard and activity aggregation,
- discussion/reporting moderation,
- admin management endpoints,
- environment-specific execution-service integration.

Key areas:

- `server/index.js`: Express composition, route mounting, execution proxy endpoint.
- `server/controllers/questionController.js`: curated question evaluation flow.
- `server/routes/aiRoutes.js`: AI challenge generation and submission flow.
- `server/utils/codeChangeMetrics.js`: token-based change analysis.
- `server/utils/scoringPolicy.js`: bounded penalty logic.
- `server/models/User.js`: points, activity, and challenge progress state.

### Persistence

MongoDB stores:

- users,
- questions,
- discussion messages,
- per-user challenge progress,
- leaderboard-relevant point totals,
- daily activity counts.

### Adapters and Deployment

- `api/index.js` and `api/[...path].js` adapt Express for Vercel.
- `vercel.json` rewrites API requests and SPA routes.
- `docker-compose.yaml` supports local infrastructure, especially execution/model experimentation.

## Primary Data Flows

### 1. Curated Challenge Flow

```text
Browser
  -> GET /api/questions/:level
  -> questionController.getQuestionsByLevel
  -> MongoDB Question query
  -> JSON response

Browser
  -> GET /api/questions/:level/:id
  -> questionController.getQuestionByLevel
  -> MongoDB Question query
  -> JSON response
```

### 2. Curated Submission Flow

```text
Browser
  -> POST /api/questions/submit
  -> auth middleware
  -> schema validation
  -> Question lookup
  -> User lookup
  -> external execution service
  -> expected output resolution
  -> change metric calculation
  -> scoring policy update
  -> MongoDB user update
  -> result payload
```

Important behaviors:

- correctness is based on runtime output,
- not all correct outputs receive points if edit volume exceeds policy,
- first failed attempt is free,
- repeated failures trigger capped penalties.

### 3. AI Challenge Generation Flow

```text
Browser
  -> POST /api/ai/generate
  -> auth middleware + rate limit
  -> input sanitization + schema validation
  -> Genkit prompt
  -> Google AI model
  -> schema-constrained challenge payload
  -> JSON response
```

### 4. AI Submission Flow

```text
Browser
  -> POST /api/ai/submit
  -> auth middleware
  -> execution service
  -> output normalization
  -> synthetic challenge key generation
  -> scoring policy update
  -> MongoDB user update
  -> evaluation response
```

Notable design choice:

- AI challenges are tracked without permanent question rows by hashing the challenge payload into a stable challenge key.

### 5. General Code Execution Flow

```text
Browser
  -> POST /api/execute
  -> auth middleware + rate limit
  -> language/version mapping
  -> endpoint fallback builder
  -> external execution service
  -> normalized output/status response
```

## Modularity Strategy

### Route -> Controller -> Utility separation

The backend mostly follows a practical layered pattern:

- routes define URL boundaries,
- controllers own orchestration and persistence,
- utilities encode reusable logic such as scoring and text sanitization,
- models capture stored state.

### Shared policy in utilities

Two utilities are central to keeping business logic from leaking everywhere:

- `scoringPolicy.js` centralizes reward/penalty rules.
- `codeChangeMetrics.js` centralizes the definition of "minimal fix."

### Thin deployment adapters

The Vercel entry files intentionally do very little. That keeps deployment concerns from contaminating application logic and lets local Express startup stay intact.

## Engineering Constraints

### Execution is external

The application does not own sandboxed code execution directly. It relies on `CODE_EXECUTION_SERVICE_URL`, which creates both flexibility and risk.

Benefits:

- easier deployment of the learning app,
- executor can be scaled or replaced independently,
- safer separation of responsibilities.

Costs:

- network latency affects challenge feedback,
- endpoint compatibility must be handled defensively,
- environment configuration becomes critical.

### AI output must be constrained

AI generation is not trusted as plain text. The server wraps generation in a schema so the client receives structured challenge content rather than prompt-shaped prose.

### Backward compatibility with older question rows

The controller still infers language when stored question data says `text` or `plaintext`. That indicates the schema and seed data evolved over time, and the code preserves compatibility at read time rather than forcing a one-shot migration.

## Hard Part Analysis

### `server/utils/codeChangeMetrics.js`

This file carries one of the most subtle product constraints in the repository.

Engineering challenge:

- compare changes across multiple programming languages,
- normalize code enough to be fair,
- stay lightweight enough to run inline during request handling,
- avoid pulling in a full parser or AST stack per language.

Why the current design exists:

- tokenization is language-aware but intentionally shallow,
- the diff engine uses longest-common-subsequence style dynamic programming,
- the output is a percentage that can drive scoring policy.

This is a compromise between correctness and operational simplicity:

- better than raw string comparison,
- cheaper than AST-based semantic diffing,
- imperfect for deeply language-specific constructs.

### `server/controllers/questionController.js` and `server/routes/aiRoutes.js`

These are orchestration-heavy because they combine:

- request validation,
- persistence,
- external execution,
- output normalization,
- scoring,
- daily activity updates,
- learner-facing response messaging.

## External Interfaces

### REST APIs

The system talks to the outside world primarily through REST:

- browser to backend,
- backend to external executor,
- backend to Google AI through Genkit.

Why REST fits here:

- request/response interactions dominate the product,
- challenge submission is naturally synchronous from the learner's perspective,
- deployment on Vercel and standard browser clients favors simple HTTP boundaries.
