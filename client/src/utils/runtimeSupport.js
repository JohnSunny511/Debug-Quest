export const RUNTIME_NOTE_PATH = "/runtime-note";

const RUNTIME_NOTE_HINT = "For more info, open the Runtime Note in the README section.";

export function getExecutionServiceMessage() {
  return `Code execution is unavailable because the required container service is not running. ${RUNTIME_NOTE_HINT}`;
}

export function getChatbotServiceMessage() {
  return `The debug assistant is unavailable because the RAG container service is not running. ${RUNTIME_NOTE_HINT}`;
}

export function isServiceUnavailableError(message) {
  const text = String(message || "").toLowerCase();

  return (
    text.includes("code execution service unavailable") ||
    text.includes("chatbot service is unavailable") ||
    text.includes("container service is not running") ||
    text.includes("container is not running") ||
    text.includes("container is not reachable") ||
    text.includes("execution service request failed") ||
    text.includes("failed to execute code") ||
    text.includes("socket hang up") ||
    text.includes("econnrefused") ||
    text.includes("fetch failed") ||
    text.includes("network error")
  );
}
