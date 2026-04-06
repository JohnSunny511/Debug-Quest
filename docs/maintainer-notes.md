# Maintainer Notes

## Five Questions for Future You

### 1. The Failure

What is one thing I tried that did not work, and why?

The earlier validation approach treated a submission as correct only when its source text matched the stored answer. That failed because debugging exercises can have multiple valid fixes, so the system would reject behaviorally correct solutions.

### 2. The Trade-off

What did I give up to get what I wanted?

The project chose Genkit plus Google AI schema-constrained prompts over raw model text handling. That gave the UI a predictable payload contract, but it added prompt/schema coordination overhead.

### 3. The Aha Moment

What bug took too long to fix?

The AI generation path appears to have hit a model compatibility or reliability issue. Commit history shows the model changed from `googleai/gemini-2.0-flash` to `googleai/gemini-2.5-flash` specifically to restore working behavior.

### 4. The External Constraint

Did the environment limit the implementation?

Yes. Code execution is externalized behind `CODE_EXECUTION_SERVICE_URL`, and the frontend has explicit local-vs-deployed origin handling. Port availability, hosted routing, and service topology directly shaped the implementation.

### 5. The Integration

How does this project talk to the outside world, and why this protocol?

The project uses REST for browser-to-backend and backend-to-executor communication, plus Genkit's HTTP-backed model integration for AI generation. That matches the system's synchronous request/response workflow around auth, challenge fetch, execution, scoring, and moderation.
