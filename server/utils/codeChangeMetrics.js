const TOKEN_WEIGHTS = {
  keyword: 3,
  operator: 3,
  identifier: 2,
  literal: 2,
  indent: 1.5,
  punctuation: 0.25,
  text: 1,
};

const LANGUAGE_KEYWORDS = {
  python: new Set([
    "and",
    "as",
    "assert",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "False",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "None",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "True",
    "try",
    "while",
    "with",
    "yield",
  ]),
  javascript: new Set([
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
  ]),
  c: new Set([
    "auto",
    "break",
    "case",
    "char",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extern",
    "float",
    "for",
    "goto",
    "if",
    "inline",
    "int",
    "long",
    "register",
    "restrict",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "struct",
    "switch",
    "typedef",
    "union",
    "unsigned",
    "void",
    "volatile",
    "while",
  ]),
};

const TOKEN_PATTERN =
  /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|===|!==|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|%=|&&|\|\||=>|[a-zA-Z_][a-zA-Z0-9_]*|[+\-*/%=<>&|!^~?:.,;()[\]{}#]/g;

const OPERATORS = new Set([
  "=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "==",
  "===",
  "!=",
  "!==",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "!",
  "&",
  "|",
  "^",
  "~",
  "?",
  ":",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "=>",
]);

const PUNCTUATION = new Set(["(", ")", "[", "]", "{", "}", ",", ".", ";", "#"]);

function normalizeLanguage(language) {
  const lower = String(language || "").trim().toLowerCase();

  if (["python3", "py"].includes(lower)) return "python";
  if (["js", "node", "nodejs"].includes(lower)) return "javascript";
  if (["c99", "gcc"].includes(lower)) return "c";
  if (["plaintext"].includes(lower)) return "text";

  return lower || "text";
}

function createToken(type, value, weightOverride) {
  const weight = weightOverride ?? TOKEN_WEIGHTS[type] ?? 1;
  return {
    type,
    value,
    weight,
    key: `${type}:${value}`,
  };
}

function classifyCodeToken(rawToken, language) {
  const keywords = LANGUAGE_KEYWORDS[language] || new Set();

  if (/^"(?:\\.|[^"\\])*"$|^'(?:\\.|[^'\\])*'$/.test(rawToken)) {
    return createToken("literal", rawToken);
  }

  if (/^\d+(?:\.\d+)?$/.test(rawToken)) {
    return createToken("literal", rawToken);
  }

  if (keywords.has(rawToken)) {
    return createToken("keyword", rawToken);
  }

  if (OPERATORS.has(rawToken)) {
    return createToken("operator", rawToken);
  }

  if (PUNCTUATION.has(rawToken)) {
    return createToken("punctuation", rawToken);
  }

  return createToken("identifier", rawToken);
}

function tokenizeCode(source, language) {
  return String(source || "")
    .replace(/\r/g, "")
    .split("\n")
    .flatMap((line) => {
      const trimmedLine = line.replace(/\s+$/, "");
      if (!trimmedLine.trim()) {
        return [];
      }

      const tokens = [];
      if (language === "python") {
        const indent = (trimmedLine.match(/^(\s*)/) || ["", ""])[1];
        if (indent.length > 0) {
          tokens.push(createToken("indent", `indent:${indent.length}`));
        }
      }

      const rawTokens = trimmedLine.trim().match(TOKEN_PATTERN) || [];
      rawTokens.forEach((rawToken) => {
        if (language === "javascript" && rawToken === ";") {
          return;
        }

        tokens.push(classifyCodeToken(rawToken, language));
      });

      return tokens;
    });
}

function tokenizeText(source) {
  const rawTokens =
    String(source || "").replace(/\r/g, "").trim().match(/[a-zA-Z0-9_]+|[^\s]/g) || [];

  return rawTokens.map((rawToken) => createToken("text", rawToken));
}

function getTokens(source, language) {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage === "python" || normalizedLanguage === "javascript" || normalizedLanguage === "c") {
    return tokenizeCode(source, normalizedLanguage);
  }

  return tokenizeText(source);
}

function computeWeightedMatch(originalTokens, modifiedTokens) {
  const m = originalTokens.length;
  const n = modifiedTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (originalTokens[i - 1].key === modifiedTokens[j - 1].key) {
        dp[i][j] = dp[i - 1][j - 1] + originalTokens[i - 1].weight;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function sumTokenWeights(tokens) {
  return Number(tokens.reduce((total, token) => total + token.weight, 0).toFixed(2));
}

function calculateChangeMetrics(original, modified, language) {
  const originalTokens = getTokens(original, language);
  const modifiedTokens = getTokens(modified, language);
  const originalWeight = sumTokenWeights(originalTokens);
  const modifiedWeight = sumTokenWeights(modifiedTokens);
  const matchedWeight = Number(
    computeWeightedMatch(originalTokens, modifiedTokens).toFixed(2)
  );
  const changes = Number(
    Math.max(0, originalWeight + modifiedWeight - 2 * matchedWeight).toFixed(2)
  );
  const baselineWeight = Math.max(originalWeight, 1);
  const percentage = Number(((changes / baselineWeight) * 100).toFixed(2));

  return {
    changes,
    originalTokenCount: originalTokens.length,
    modifiedTokenCount: modifiedTokens.length,
    originalWeight,
    modifiedWeight,
    matchedWeight,
    percentage,
  };
}

module.exports = {
  calculateChangeMetrics,
  normalizeLanguage,
};
