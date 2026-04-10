const Question = require("../models/Question");
const User = require("../models/User");
const mongoose = require("mongoose");
const { z } = require("zod");
const axios = require("axios");
const { calculateChangeMetrics, normalizeLanguage } = require("../utils/codeChangeMetrics");
const {
  ANSWER_REVEAL_SUCCESS_POINTS,
  SUCCESS_POINTS,
  buildFailureScoreUpdate,
  normalizeChallengeProgress,
} = require("../utils/scoringPolicy");

const LANGUAGE_CONFIG = {
  python: { version: "3.10.0" },
  javascript: { version: "18.15.0" },
  c: { version: "10.2.0" },
};

function buildExecutionEndpoints(baseUrl) {
  if (!baseUrl) return [];

  if (/\/(api\/v2\/execute|execute|api\/execute|run|api\/run)$/i.test(baseUrl)) {
    return [baseUrl];
  }

  return [
    `${baseUrl}/api/v2/execute`,
    `${baseUrl}/execute`,
    `${baseUrl}/api/execute`,
    `${baseUrl}/run`,
    `${baseUrl}/api/run`,
  ];
}

async function executeSubmissionCode(language, code) {
  const normalizedLanguage = normalizeLanguage(language);
  const languageConfig = LANGUAGE_CONFIG[normalizedLanguage];
  const baseUrl = process.env.CODE_EXECUTION_SERVICE_URL
    ? process.env.CODE_EXECUTION_SERVICE_URL.replace(/\/+$/, "")
    : "";

  if (!languageConfig || !baseUrl) {
    throw new Error("Code execution service unavailable.");
  }

  const executionEndpoints = buildExecutionEndpoints(baseUrl);
  const requestBody = {
    language: normalizedLanguage,
    version: languageConfig.version,
    files: [{ content: code }],
  };

  let response;
  let lastError;

  for (const executionEndpoint of executionEndpoints) {
    try {
      response = await axios.post(executionEndpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
      break;
    } catch (error) {
      lastError = error;
      if (error.response && error.response.status === 400) {
        break;
      }
    }
  }

  if (!response) {
    throw lastError || new Error("Execution failed.");
  }

  const run = response.data?.run || {};
  const output = run.output || run.stdout || run.stderr || run.compile_output || "";
  const exitCode = typeof run.code === "number" ? run.code : null;

  return {
    output: String(output || ""),
    succeeded: exitCode === 0 && !String(run.stderr || run.compile_output || "").trim(),
  };
}

async function resolveExpectedOutput(question) {
  const configuredExpectedOutput = normalizeOutput(question.expected);
  const candidateAnswer = String(question.correctAnswer || "").trim();

  if (!candidateAnswer) {
    return configuredExpectedOutput;
  }

  try {
    const executed = await executeSubmissionCode(question.language, candidateAnswer);
    if (executed.succeeded && normalizeOutput(executed.output)) {
      return normalizeOutput(executed.output);
    }
  } catch (_error) {
    // Fall back to the stored expected value when the reference answer can't be executed.
  }

  return configuredExpectedOutput;
}

function inferLanguageFromCode(value) {
  const text = String(value || "");

  const looksLikePython =
    /\bdef\s+\w+\s*\(/.test(text) ||
    /\bprint\s*\(/.test(text) ||
    /\bfor\s+\w+\s+in\b/.test(text) ||
    /\bif\s+.+:/.test(text) ||
    /\breturn\b/.test(text);
  if (looksLikePython) return "python";

  const looksLikeC =
    /#include\s*<[^>]+>/.test(text) ||
    /\bint\s+main\s*\(/.test(text) ||
    /\bprintf\s*\(/.test(text);
  if (looksLikeC) return "c";

  const looksLikeJavaScript =
    /\bfunction\s+\w+\s*\(/.test(text) ||
    /\bconsole\.log\s*\(/.test(text) ||
    /\b(let|const|var)\s+\w+/.test(text) ||
    /=>/.test(text);
  if (looksLikeJavaScript) return "javascript";

  return "text";
}

function withResolvedLanguage(question) {
  const payload = question?.toObject ? question.toObject() : question;
  if (!payload) return payload;

  const currentLanguage = String(payload.language || "").toLowerCase();
  if (currentLanguage !== "text" && currentLanguage !== "plaintext") {
    return payload;
  }

  const inferredLanguage = inferLanguageFromCode(payload.code);
  if (inferredLanguage !== "text") {
    payload.language = inferredLanguage;
  }

  return payload;
}

function getChallengeProgressEntry(user, challengeKey) {
  return normalizeChallengeProgress(user).find((entry) => entry.challengeKey === challengeKey) || null;
}

function serializeQuestionForUser(question, user, role) {
  const payload = withResolvedLanguage(question);
  const challengeKey = `question:${String(payload?._id || "")}`;
  const challengeEntry = challengeKey ? getChallengeProgressEntry(user, challengeKey) : null;
  const answerUnlocked = role === "admin" || challengeEntry?.answerRevealed === true;
  const hasCorrectAnswer = typeof payload?.correctAnswer === "string" && payload.correctAnswer.trim().length > 0;

  if (!answerUnlocked) {
    delete payload.correctAnswer;
  }

  return {
    ...payload,
    hasCorrectAnswer,
    answerUnlocked,
    pointsOnSuccess: answerUnlocked ? ANSWER_REVEAL_SUCCESS_POINTS : SUCCESS_POINTS,
    fullPointsOnSuccess: SUCCESS_POINTS,
    reducedPointsOnSuccess: ANSWER_REVEAL_SUCCESS_POINTS,
  };
}

function toLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeOutput(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim();
}

// GET /api/questions/:level
exports.getQuestionsByLevel = async (req, res) => {
  try {
    const parsed = z.object({ level: z.enum(["easy", "medium", "hard"]) }).safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid level" });
    }

    const { level } = parsed.data;
    const questions = await Question.find({ level });
    if (!questions.length) {
      return res.status(404).json({ error: "No questions found for this level" });
    }
    const user = await User.findById(req.user.id).lean();
    res.json(questions.map((question) => serializeQuestionForUser(question, user, req.user.role)));
  } catch (_err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/questions/:level/:id
exports.getQuestionByLevel = async (req, res) => {
  try {
    const parsed = z
      .object({
        level: z.enum(["easy", "medium", "hard"]),
        id: z.coerce.number().int().positive(),
      })
      .safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid question request" });
    }

    const { level, id } = parsed.data;
    const question = await Question.findOne({ level, id });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    const user = await User.findById(req.user.id).lean();
    res.json(serializeQuestionForUser(question, user, req.user.role));
  } catch (_err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/questions/:questionId/reveal-answer
exports.revealAnswerHandler = async (req, res) => {
  try {
    const parsed = z
      .object({
        questionId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
          message: "Invalid question reference.",
        }),
      })
      .safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid question request" });
    }

    const { questionId } = parsed.data;
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const challengeKey = `question:${String(question._id)}`;
    const progress = normalizeChallengeProgress(user);
    const entryIndex = progress.findIndex((entry) => entry.challengeKey === challengeKey);
    const currentEntry =
      entryIndex >= 0
        ? progress[entryIndex]
        : { challengeKey, failedAttempts: 0, penaltyPoints: 0, answerRevealed: false };

    if (!currentEntry.answerRevealed) {
      const nextEntry = {
        ...currentEntry,
        answerRevealed: true,
      };

      if (entryIndex >= 0) {
        progress[entryIndex] = nextEntry;
      } else {
        progress.push(nextEntry);
      }

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          challengeProgress: progress,
        },
      });
    }

    return res.json({
      correctAnswer: String(question.correctAnswer || ""),
      pointsOnSuccess: ANSWER_REVEAL_SUCCESS_POINTS,
      fullPointsOnSuccess: SUCCESS_POINTS,
      message: `Answer revealed. Solving this question now awards ${ANSWER_REVEAL_SUCCESS_POINTS} points instead of ${SUCCESS_POINTS}.`,
    });
  } catch (_err) {
    return res.status(500).json({ message: "Server error." });
  }
};

// POST /api/questions/submit
exports.submitHandler = async (req, res) => {
  try {
    const parsed = z
      .object({
        id: z.coerce.number().int().positive().optional(),
        code: z.string().min(1).max(50000),
        level: z.enum(["easy", "medium", "hard"]).optional(),
        questionId: z.string().optional(),
      })
      .refine(
        (value) =>
          (value.questionId && mongoose.Types.ObjectId.isValid(value.questionId)) ||
          (value.id !== undefined && value.level),
        { message: "A valid question reference is required." }
      )
      .safeParse(req.body || {});

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid submission" });
    }

    const { id, code, level, questionId } = parsed.data;
    let question = null;

    if (questionId) {
      question = await Question.findById(questionId);
    } else if (id !== undefined && level) {
      question = await Question.findOne({ id, level });
    } else if (id !== undefined) {
      question = await Question.findOne({ id });
    }

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const challengeKey = `question:${String(question._id)}`;
    const challengeEntry = getChallengeProgressEntry(user, challengeKey);
    const answerWasRevealed = challengeEntry?.answerRevealed === true;
    const successPoints = answerWasRevealed ? ANSWER_REVEAL_SUCCESS_POINTS : SUCCESS_POINTS;
    const executed = await executeSubmissionCode(question.language, code);
    const expectedOutput = await resolveExpectedOutput(question);
    const expectedOutputDisplay = String(question.expected || "").trim() || expectedOutput;

    if (!executed.succeeded) {
      const failureUpdate = buildFailureScoreUpdate(user, challengeKey, "runtime");

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          points: failureUpdate.nextPoints,
          challengeProgress: failureUpdate.challengeProgress,
        },
      });

      return res.json({
        message:
          failureUpdate.pointsDelta === 0
            ? "Incorrect. Your code did not run successfully. First failed attempt on this question is free."
            : `Incorrect. Your code did not run successfully. ${Math.abs(failureUpdate.pointsDelta)} point(s) deducted.`,
        isCorrect: false,
        pointsDelta: failureUpdate.pointsDelta,
        points: failureUpdate.nextPoints,
        expectedOutput: expectedOutputDisplay,
        actualOutput: executed.output,
      });
    }

    if (normalizeOutput(executed.output) !== expectedOutput) {
      const failureUpdate = buildFailureScoreUpdate(user, challengeKey, "wrong_output");

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          points: failureUpdate.nextPoints,
          challengeProgress: failureUpdate.challengeProgress,
        },
      });

      return res.json({
        message:
          failureUpdate.pointsDelta === 0
            ? "Incorrect. Your code ran, but the output did not match the expected output. First failed attempt on this question is free."
            : `Incorrect. Your code ran, but the output did not match the expected output. ${Math.abs(failureUpdate.pointsDelta)} point(s) deducted.`,
        isCorrect: false,
        pointsDelta: failureUpdate.pointsDelta,
        points: failureUpdate.nextPoints,
        expectedOutput: expectedOutputDisplay,
        actualOutput: executed.output,
      });
    }

    const changeMetrics = calculateChangeMetrics(question.code || "", code, question.language);
    const maxChangePercentage =
      typeof question.maxChangePercentage === "number" ? question.maxChangePercentage : null;

    if (maxChangePercentage !== null && changeMetrics.percentage > maxChangePercentage) {
      return res.json({
        message: `Output matched, but points were not awarded because the change percentage (${changeMetrics.percentage}%) exceeded the allowed limit (${maxChangePercentage}%).`,
        isCorrect: false,
        pointsDelta: 0,
        points: Number(user.points || 0),
        expectedOutput: expectedOutputDisplay,
        actualOutput: executed.output,
        changePercentage: changeMetrics.percentage,
        maxChangePercentage,
      });
    }

    {
      const today = toLocalDateKey(new Date());
      const nextActivity = Array.isArray(user.activity) ? [...user.activity] : [];
      const existingIndex = nextActivity.findIndex((entry) => entry.date === today);

      if (existingIndex >= 0) {
        nextActivity[existingIndex] = {
          date: today,
          count: Number(nextActivity[existingIndex].count || 0) + 1,
        };
      } else {
        nextActivity.push({ date: today, count: 1 });
      }

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          activity: nextActivity
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .slice(-365),
        },
        $inc: { points: successPoints },
      });

      return res.json({
        message: answerWasRevealed
          ? `Correct! Answer was viewed, so ${successPoints} points awarded instead of ${SUCCESS_POINTS}.`
          : "Correct! Points awarded.",
        isCorrect: true,
        pointsDelta: successPoints,
        points: Number(user.points || 0) + successPoints,
        expectedOutput: expectedOutputDisplay,
        actualOutput: executed.output,
        changePercentage: changeMetrics.percentage,
        maxChangePercentage,
        answerWasRevealed,
      });
    }
  } catch (_err) {
    res.status(500).json({ message: "Server error." });
  }
};
