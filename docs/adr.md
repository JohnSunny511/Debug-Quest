# ADR Summary

This file summarizes the major "this vs. that" choices visible in the current codebase and commit history.

## ADR-001: Runtime behavior validation over source-text equality

- Chosen: execute learner code and compare output.
- Rejected/previous: compare submission text directly to `correctAnswer`.
- Why: debugging tasks can have multiple valid fixes; text equality rewards copying instead of diagnosis.
- Consequence: correctness now depends on an external execution runtime and output normalization.

## ADR-002: Minimal-fix scoring over unlimited rewrite freedom

- Chosen: token-based change percentage plus reward/penalty policy.
- Rejected/alternative: award points whenever output matches, regardless of edit volume.
- Why: the product goal is debugging, not rewriting from scratch.
- Consequence: scoring is fairer for the learning objective, but more complex and language-sensitive.

## ADR-003: First failure free, then capped penalties

- Chosen: no penalty on first failed attempt, then bounded deductions with higher runtime-failure cost.
- Rejected/alternative: immediate penalties or unlimited penalty accumulation.
- Why: encourages experimentation while still discouraging brute-force retries.
- Consequence: user state now tracks `challengeProgress` and penalty accumulation per challenge.

## ADR-004: External execution service over embedded local execution

- Chosen: call an execution service through `CODE_EXECUTION_SERVICE_URL`.
- Rejected/alternative: embed all execution directly in the web app process.
- Why: isolation, deployability, and operational separation.
- Consequence: network dependency and provider-compatibility handling become part of request logic.

## ADR-005: Endpoint fallback compatibility over single fixed executor contract

- Chosen: try several common execution endpoint shapes (`/api/v2/execute`, `/execute`, `/run`, etc.).
- Rejected/alternative: assume one exact upstream path.
- Why: reduces friction across local and hosted executors and supports provider changes without broad app rewrites.
- Consequence: integration logic is more defensive, but duplicated in multiple places.

## ADR-006: Genkit with schema-constrained Google AI over free-form AI output

- Chosen: Genkit prompt with Zod-backed output schema.
- Rejected/alternative: raw model text parsing.
- Why: AI-generated challenges must arrive in a predictable structure for the UI and evaluator.
- Consequence: lower parsing risk, but the prompt and model must stay aligned with the schema.

## ADR-007: Updated Gemini model over keeping the original model revision

- Chosen: `googleai/gemini-2.5-flash`.
- Previous: `googleai/gemini-2.0-flash`.
- Why: commit history indicates the model was updated specifically to restore functionality.
- Consequence: the AI contract remained stable while reliability was improved by swapping the model layer.

## ADR-008: Vercel adapter layer over backend rewrite for deployment

- Chosen: export the Express app and mount it through `api/index.js` and `api/[...path].js`.
- Rejected/alternative: rewrite the backend into framework-native serverless handlers.
- Why: fastest path to deployment with minimal business-logic churn.
- Consequence: local and deployed server entry points remain aligned, but Express conventions still shape the app.

## ADR-009: Same-origin deployment awareness over hard-coded local backend URLs

- Chosen: compute API base URL from browser origin when not running on local dev ports.
- Previous: fixed `http://localhost:5000`.
- Why: deployment required the client to work under Vercel rewrites and same-origin hosting.
- Consequence: smoother deployment, with slightly more environment detection logic in the client.

## ADR-010: Read-time language inference over forced data migration

- Chosen: infer language from code when stored question rows still say `text` or `plaintext`.
- Rejected/alternative: require all legacy records to be migrated before read operations work correctly.
- Why: preserves compatibility with older question data and seeds.
- Consequence: question retrieval logic carries historical cleanup responsibility.

## ADR-011: Route/controller modularity over a monolithic server file

- Chosen: split features into routes, controllers, models, and utilities.
- Rejected/previous: earlier smaller app stages with less separation.
- Why: features expanded to include auth, admin, leaderboard, AI generation, discussions, and dashboards.
- Consequence: better maintainability, though some controller files are now orchestration-heavy.

## ADR-012: Internal admin surfaces over direct database-only operations

- Chosen: add admin routes and pages for question management, chatbot settings, and moderation.
- Rejected/alternative: maintain content and reports directly in the database or scripts.
- Why: operational workflows became part of the product, not just one-time setup tasks.
- Consequence: broader surface area, but lower operational friction for content updates.

## ADR-013: REST over persistent bidirectional protocols

- Chosen: REST/HTTP for browser-backend and backend-service communication.
- Alternative: WebSockets or gRPC.
- Why: the dominant operations are request/response, deployment is web-centric, and the data model does not require streaming-first behavior.
- Consequence: simpler integration and deployment, with no built-in realtime channel.

## ADR-014: Docker Compose as optional local support, not the primary production architecture

- Chosen: keep Compose for local infrastructure experiments and support services.
- Rejected/alternative: make Compose the only documented production path.
- Why: the active deployment story is Vercel plus external services, while Compose still helps local integration testing.
- Consequence: contributors need documentation to distinguish "current production shape" from "local experimentation stack."
