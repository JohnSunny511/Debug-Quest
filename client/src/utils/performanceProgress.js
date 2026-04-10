function createTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const STANDARD_LEVELS = ["easy", "medium", "hard"];
const RECOMMENDATION_WINDOW_SIZE = 8;

export function createDefaultPerformanceHistory(score = 100) {
  return [{ time: createTimestamp(), score }];
}

export function getUserProgressStorageKey(username, key) {
  return `debugQuest:${username}:${key}`;
}

export function readUserProgress(username, key, fallbackValue) {
  if (!username) return fallbackValue;

  const stored = localStorage.getItem(getUserProgressStorageKey(username, key));
  if (!stored) return fallbackValue;

  try {
    return JSON.parse(stored);
  } catch (_error) {
    return fallbackValue;
  }
}

export function readUserPerformanceScore(username, fallbackValue = 100) {
  if (!username) return fallbackValue;

  const raw = localStorage.getItem(getUserProgressStorageKey(username, "performanceScore"));
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

export function readRecentSubmissions(username) {
  const entries = readUserProgress(username, "recentSubmissions", []);
  return Array.isArray(entries) ? entries : [];
}

export function deriveDifficultyRecommendation({
  recentSubmissions = [],
  accuracyStats = { total: 0, correct: 0 },
  performanceScore = 100,
} = {}) {
  const standardEntries = (Array.isArray(recentSubmissions) ? recentSubmissions : []).filter((entry) =>
    STANDARD_LEVELS.includes(String(entry?.level || "").toLowerCase())
  );

  const sampleSize = standardEntries.length;
  const accuracyTotal = Number(accuracyStats?.total || 0);
  const accuracyCorrect = Number(accuracyStats?.correct || 0);
  const overallAccuracy = accuracyTotal > 0 ? accuracyCorrect / accuracyTotal : 0;
  const recentCorrect = standardEntries.filter((entry) => entry?.isCorrect).length;
  const recentAccuracy = sampleSize > 0 ? recentCorrect / sampleSize : 0;
  const hardWins = standardEntries.filter((entry) => entry?.level === "hard" && entry?.isCorrect).length;
  const mediumWins = standardEntries.filter((entry) => entry?.level === "medium" && entry?.isCorrect).length;
  const easyWins = standardEntries.filter((entry) => entry?.level === "easy" && entry?.isCorrect).length;

  let recentSuccessStreak = 0;
  for (let index = standardEntries.length - 1; index >= 0; index -= 1) {
    if (standardEntries[index]?.isCorrect) {
      recentSuccessStreak += 1;
    } else {
      break;
    }
  }

  if (sampleSize < 3) {
    return {
      level: "easy",
      confidence: "warming-up",
      sampleSize,
      reason: "Start with easy challenges until we collect a few more submissions.",
    };
  }

  if (
    sampleSize >= 5 &&
    recentAccuracy >= 0.75 &&
    overallAccuracy >= 0.7 &&
    (hardWins >= 2 || (mediumWins >= 2 && recentSuccessStreak >= 2)) &&
    Number(performanceScore || 0) >= 120
  ) {
    return {
      level: "hard",
      confidence: "high",
      sampleSize,
      reason: "Recent submissions show strong accuracy and consistent success on medium or hard questions.",
    };
  }

  if (
    sampleSize >= 3 &&
    recentAccuracy >= 0.66 &&
    overallAccuracy >= 0.6 &&
    (mediumWins >= 1 || easyWins >= 2 || recentSuccessStreak >= 2)
  ) {
    return {
      level: "medium",
      confidence: sampleSize >= 5 ? "high" : "building",
      sampleSize,
      reason: "You are solving enough recent challenges consistently to step into medium difficulty.",
    };
  }

  return {
    level: "easy",
    confidence: sampleSize >= 6 ? "high" : "building",
    sampleSize,
    reason: "Recent results suggest easy challenges are the best place to build momentum right now.",
  };
}

export function applySubmissionProgress(
  username,
  { pointsDelta = 0, isCorrect = false, questionId = "", level = "" } = {}
) {
  if (!username) return null;

  const currentScore = readUserPerformanceScore(username, 100);
  const nextScore = Math.max(0, currentScore + Number(pointsDelta || 0));
  const historyFallback = createDefaultPerformanceHistory(currentScore);
  const history = readUserProgress(username, "performanceHistory", historyFallback);
  const normalizedHistory = Array.isArray(history) && history.length > 0 ? [...history] : historyFallback;

  if (Number(pointsDelta || 0) !== 0) {
    normalizedHistory.push({ time: createTimestamp(), score: nextScore });
  }

  localStorage.setItem(getUserProgressStorageKey(username, "performanceScore"), String(nextScore));
  localStorage.setItem(
    getUserProgressStorageKey(username, "performanceHistory"),
    JSON.stringify(normalizedHistory.slice(-9))
  );

  const currentAccuracy = readUserProgress(username, "accuracyStats", { total: 0, correct: 0 });
  const nextAccuracy = {
    total: Number(currentAccuracy?.total || 0) + 1,
    correct: Number(currentAccuracy?.correct || 0) + (isCorrect ? 1 : 0),
  };
  localStorage.setItem(
    getUserProgressStorageKey(username, "accuracyStats"),
    JSON.stringify(nextAccuracy)
  );

  const normalizedLevel = String(level || "").toLowerCase();
  const recentSubmissions = readRecentSubmissions(username);
  const nextRecentSubmissions = [
    ...recentSubmissions,
    {
      timestamp: Date.now(),
      level: normalizedLevel,
      isCorrect: Boolean(isCorrect),
      pointsDelta: Number(pointsDelta || 0),
      questionId: questionId || "",
    },
  ].slice(-RECOMMENDATION_WINDOW_SIZE);
  localStorage.setItem(
    getUserProgressStorageKey(username, "recentSubmissions"),
    JSON.stringify(nextRecentSubmissions)
  );

  if (isCorrect && questionId) {
    const solvedQuestions = readUserProgress(username, "solvedQuestions", []);
    const nextSolvedQuestions = solvedQuestions.includes(questionId)
      ? solvedQuestions
      : [...solvedQuestions, questionId];
    localStorage.setItem(
      getUserProgressStorageKey(username, "solvedQuestions"),
      JSON.stringify(nextSolvedQuestions)
    );
  }

  const nextSolvedQuestions = readUserProgress(username, "solvedQuestions", []);

  return {
    nextScore,
    nextAccuracy,
    nextSolvedQuestions,
    nextRecentSubmissions,
    recommendation: deriveDifficultyRecommendation({
      recentSubmissions: nextRecentSubmissions,
      accuracyStats: nextAccuracy,
      performanceScore: nextScore,
    }),
  };
}
