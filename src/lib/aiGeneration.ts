const OPENROUTER_EXTRACT_MODEL = process.env.MATH_EXTRACT_MODEL || "openai/gpt-oss-20b:free";
const OPENROUTER_EXTRACT_MODELS = (process.env.MATH_EXTRACT_MODELS || `${OPENROUTER_EXTRACT_MODEL}`)
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
const OPENROUTER_SOLVE_MODEL = process.env.MATH_SOLVER_MODEL || "qwen/qwen-plus";
const OPENROUTER_SOLVE_MODELS = (process.env.MATH_SOLVER_MODELS || `${OPENROUTER_SOLVE_MODEL}`)
  .split(",")
  .map((x) => x.trim())
  .filter((x) => Boolean(x) && x !== "stepfun/step-3.5-flash:free");
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const EXTRACT_MODEL_RETRIES = 1;
const AI_TIMEOUT_MS = 15000;

export type QuestionType = "mcq" | "true_false" | "short_answer" | "essay";

export interface GeneratedSubQuestion {
  id: string;
  content: string;
  answerKey: "true" | "false";
  order: number;
}

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: Record<"A" | "B" | "C" | "D", string>;
  correct_answer?: "A" | "B" | "C" | "D";
  sub_questions?: GeneratedSubQuestion[];
  answer_key?: string;
  ai_solve_status?: "solved" | "unsolved";
}

type HttpError = Error & { status?: number; details?: string };

export function stripQuestionPrefix(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();

  // Loop multiple times to remove duplicated or nested leading question headers
  for (let i = 0; i < 5; i++) {
    const prev = cleaned;
    cleaned = cleaned
      .replace(/^\s*(?:#+\s*)?(?:\*\*)?\s*(?:Câu|Question|Q|Bài)?\s*\d{1,4}\s*(?:\*\*)?\s*[\).:-]?\s*(?:\*\*)?\s*/gi, "")
      .replace(/^\s*(?:\*\*)?\d{1,4}\s*[\).:-]\s*(?:\*\*)?\s*/gi, "")
      .replace(/^\s*\*\*\s*/g, "")
      .trim();
    if (cleaned === prev) break;
  }

  // Remove trailing **KQ:** or KQ: with dotted lines, underscores, or horizontal rules ---
  cleaned = cleaned
    .replace(/(?:\r?\n|\s)*(?:\*\*|\\\\\*)?\s*(?:KQ|Kết quả|Đáp số|Answer)\s*(?::|:)?\s*(?:\*\*|\\\\\*)?\s*[\.\_\-\s]*$/gi, "")
    .replace(/(?:\r?\n|\s)*(?:\*\*|\\\\\*)?\s*(?:KQ|Kết quả|Đáp số|Answer)\s*(?::|:)?\s*(?:\*\*|\\\\\*)?[\s\S]*$/gi, (match) => {
      if (/\.{2,}|_{2,}|-{2,}/.test(match)) {
        return "";
      }
      return match;
    })
    .replace(/(?:\r?\n|\s)*-{3,}\s*$/g, "")
    .trim();

  return cleaned;
}

export function stripSubQuestionPrefix(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();

  // Strip leading bold markers and labels like a), b), c), d) or a., b., c., d. or (a), (b)
  for (let i = 0; i < 3; i++) {
    const prev = cleaned;
    cleaned = cleaned
      .replace(/^\s*(?:\*\*)?\s*\(?\s*[abcd1234]\s*[\).:-]\s*(?:\*\*)?\s*/gi, "")
      .replace(/^\s*\*\*\s*/g, "")
      .trim();
    if (cleaned === prev) break;
  }

  return cleaned;
}

export function stripOptionPrefix(text: string, letter?: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  if (letter) {
    const regex = new RegExp(`^\\s*(?:\\*\\*)?\\s*${letter}\\s*[\\).:-]\\s*(?:\\*\\*)?\\s*`, "i");
    cleaned = cleaned.replace(regex, "").trim();
  } else {
    cleaned = cleaned.replace(/^\s*(?:\*\*)?\s*[ABCD]\s*[\).:-]\s*(?:\*\*)?\s*/gi, "").trim();
  }
  return cleaned;
}


async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    if (isTimeout) {
      const timeoutError: HttpError = Object.assign(new Error(`Request timeout after ${timeoutMs}ms`), {
        status: 504,
      });
      throw timeoutError;
    }
    throw error;
  }
}

function aiLog(level: "info" | "warn" | "error", stage: string, message: string, meta?: Record<string, unknown>) {
  const icon = level === "error" ? "❌" : level === "warn" ? "⚠️" : "🚀";
  const timestamp = new Date().toLocaleTimeString("vi-VN");
  const metaStr = meta ? ` | ` + JSON.stringify(meta) : "";
  console.log(`\x1b[36m[AI-ENGINE][${timestamp}][${stage}]\x1b[0m ${icon} ${message}${metaStr}`);
}

function extractAssistantText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function extractJsonArray(raw: string) {
  const normalized = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = normalized.indexOf("[");
  if (start < 0) return normalized;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) {
        return normalized.slice(start, i + 1);
      }
    }
  }

  return normalized.slice(start);
}

function repairJsonCandidate(candidate: string): string {
  let repaired = candidate;
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");
  repaired = repaired.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  return repaired;
}

function closeDanglingJson(candidate: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const ch of candidate) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" && stack[stack.length - 1] === "{") stack.pop();
    if (ch === "]" && stack[stack.length - 1] === "[") stack.pop();
  }

  let repaired = candidate;
  if (inString) {
    repaired += '"';
  }

  const closers = stack
    .reverse()
    .map((open) => (open === "{" ? "}" : "]"))
    .join("");

  return `${repaired}${closers}`;
}

function parseJsonLenient(raw: string): unknown {
  const base = extractJsonArray(raw);
  const attempts = [
    base,
    repairJsonCandidate(base),
    closeDanglingJson(base),
    closeDanglingJson(repairJsonCandidate(base)),
  ];

  let lastError: Error | null = null;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError || new Error("Unable to parse AI JSON output");
}

function normalizeLatexText(text: string): string {
  if (!text) return text;

  return text
    .replace(/≤ft/g, "\\left")
    .replace(/≥ight/g, "\\right")
    .replace(/\\{2,}(?=(?:left|right|frac|sqrt|sum|int|lim|sin|cos|tan|log|ln|pi|alpha|beta|gamma|theta)\b)/gi, "\\")
    .replace(/\/\s*fraq/gi, "\\frac")
    .replace(/\/\s*frac/gi, "\\frac")
    .replace(/\\\s*fraq/gi, "\\frac")
    .replace(/\\\s*frac/gi, "\\frac")
    .replace(/\bfrac\s*([0-9])\s*([0-9]{1,2})\b/gi, "\\frac{$1}{$2}")
    .replace(/\\\s*sqrt/gi, "\\sqrt")
    .replace(/(?:\\\s*)?√\s*\(([^()]+)\)/g, "\\sqrt{$1}")
    .replace(/(?:\\\s*)?√\s*\{([^{}]+)\}/g, "\\sqrt{$1}")
    .replace(/\\\s*times/gi, "\\times")
    .replace(/(?<!\\)\\\s+([a-zA-Z]+)/g, "\\$1");
}

function toHumanReadableMath(text: string): string {
  if (!text) return text;

  return normalizeLatexText(text)
    .replace(/(^|[^\w\\])(\d{1,4})\s*\/\s*(\d{1,4})(?=$|[^\w])/g, (_m, pre, a, b) => `${pre}\\frac{${a}}{${b}}`)
    .replace(/\\times|\\cdot/gi, "×")
    .replace(/\\div/gi, "÷")
    .replace(/\\pm/gi, "±")
    .replace(/\\leq?(?![a-zA-Z])/gi, "≤")
    .replace(/\\geq?(?![a-zA-Z])/gi, "≥")
    .replace(/\\neq/gi, "≠")
    .replace(/\\approx/gi, "≈")
    .replace(/\\infty/gi, "∞")
    .replace(/\\pi/gi, "π")
    .replace(/\\alpha/gi, "α")
    .replace(/\\beta/gi, "β")
    .replace(/\\gamma/gi, "γ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function ensureInlineMathDelimiters(text: string): string {
  if (!text) return text;

  const protectedSegments: string[] = [];
  const placeholderPrefix = "@@MATH_SEGMENT_";
  const withPlaceholders = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g, (segment) => {
    const idx = protectedSegments.push(segment) - 1;
    return `${placeholderPrefix}${idx}@@`;
  });

  const bareMathRegex =
    /(^|[\s(\[{:;=,+\-])((?:\\(?:frac\s*\{[^{}]+\}\s*\{[^{}]+\}|sqrt\s*\{[^{}]+\}|sum|int|lim|sin|cos|tan|log|ln|pi|alpha|beta|gamma|theta)|[A-Za-z0-9]+(?:_\{[^{}]+\}|_[A-Za-z0-9]+|\^\{[^{}]+\}|\^[A-Za-z0-9]+){1,3}))(?=($|[\s)\]}:;,.!?]))/g;

  const latexChunkRegex =
    /(^|[\s(\[{:;])([^$\n]*\\[a-zA-Z]+[^$\n]*)(?=($|[\s)\]}:;,.!?]))/g;

  const operatorMathRegex =
    /(^|[\s(\[{:;])([A-Za-z0-9]+(?:\s*[+\-*/=]\s*[A-Za-z0-9]+){1,}|[≤≥≠±∞π][^$\n]*)(?=($|[\s)\]}:;,.!?]))/g;

  let wrapped = withPlaceholders.replace(bareMathRegex, (_m, leading, expr) => `${leading}$${expr}$`);
  wrapped = wrapped.replace(latexChunkRegex, (_m, leading, expr) => `${leading}$${expr.trim()}$`);
  wrapped = wrapped.replace(operatorMathRegex, (_m, leading, expr) => `${leading}$${expr.trim()}$`);

  return wrapped.replace(new RegExp(`${placeholderPrefix}(\\d+)@@`, "g"), (_m, idx) => {
    const parsed = Number.parseInt(idx, 10);
    return Number.isFinite(parsed) ? protectedSegments[parsed] || "" : "";
  });
}

function normalizeMathDelimiters(text: string): string {
  if (!text) return text;

  return text
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner) => `$${inner}$`);
}

export function formatMathForRender(text: string): string {
  return ensureInlineMathDelimiters(toHumanReadableMath(normalizeMathDelimiters(text)));
}

// ----------------------------------------------------
// HEURISTIC PARSERS
// ----------------------------------------------------

function parseHeuristicMcq(text: string): GeneratedQuestion[] {
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Câu|Question|Q|Bài)\s*\d+)/i).filter(Boolean);
  const questions: GeneratedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let stem = "";
    const options: Record<"A" | "B" | "C" | "D", string> = { A: "", B: "", C: "", D: "" };
    let foundOptions = false;

    for (const line of lines) {
      const cleanLine = line.replace(/^\s*\*\*\s*/, "").replace(/\s*\*\*\s*$/, "").trim();
      const optionMatch = cleanLine.match(/^(?:\*\*)?\s*([ABCD])\s*[\).:-]\s*(?:\*\*)?\s*(.*)$/i);
      if (optionMatch) {
        foundOptions = true;
        const key = optionMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        options[key] = stripOptionPrefix(optionMatch[2] || "", key);
      } else if (!foundOptions) {
        stem += (stem ? "\n" : "") + line;
      }
    }

    stem = stripQuestionPrefix(stem);

    if (stem && (options.A || options.B || options.C || options.D)) {
      questions.push({
        type: "mcq",
        question: stem,
        options,
        correct_answer: "A",
        ai_solve_status: "unsolved",
      });
    }
  }

  return questions;
}

function parseHeuristicTrueFalse(text: string): GeneratedQuestion[] {
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Câu|Question|Q|Bài)\s*\d+)/i).filter(Boolean);
  const questions: GeneratedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let stem = "";
    const subQuestions: GeneratedSubQuestion[] = [];
    let foundSub = false;

    for (const line of lines) {
      const cleanLine = line.replace(/^\s*\*\*\s*/, "").replace(/\s*\*\*\s*$/, "").trim();
      // Match a), b), c), d) or 1), 2), 3), 4) or a., b., c., d.
      const subMatch = cleanLine.match(/^(?:\*\*)?\s*([abcd1234])\s*[\).:-]\s*(?:\*\*)?\s*(.*)$/i);
      if (subMatch) {
        foundSub = true;
        const content = stripSubQuestionPrefix(subMatch[2] || cleanLine);
        const isFalse = /\b(?:sai|false|s)\b/i.test(line);
        subQuestions.push({
          id: crypto.randomUUID(),
          content,
          answerKey: isFalse ? "false" : "true",
          order: subQuestions.length + 1,
        });
      } else if (!foundSub) {
        stem += (stem ? "\n" : "") + line;
      }
    }

    stem = stripQuestionPrefix(stem);

    if (stem && subQuestions.length > 0) {
      questions.push({
        type: "true_false",
        question: stem,
        sub_questions: subQuestions,
        ai_solve_status: "unsolved",
      });
    }
  }

  return questions;
}

function parseHeuristicShortAnswer(text: string): GeneratedQuestion[] {
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Câu|Question|Q|Bài)\s*\d+)/i).filter(Boolean);
  const questions: GeneratedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let stem = "";
    let answerKey = "";

    for (const line of lines) {
      const cleanLine = line.replace(/^\s*\*\*\s*/, "").replace(/\s*\*\*\s*$/, "").trim();
      const ansMatch = cleanLine.match(/^(?:Đáp án|Đáp số|Kết quả|Answer)\s*[\).:-]\s*(.*)$/i);
      if (ansMatch) {
        answerKey = ansMatch[1].trim();
      } else {
        stem += (stem ? "\n" : "") + line;
      }
    }

    stem = stripQuestionPrefix(stem);

    if (stem) {
      questions.push({
        type: "short_answer",
        question: stem,
        answer_key: answerKey,
        ai_solve_status: "unsolved",
      });
    }
  }

  return questions;
}

function parseHeuristicEssay(text: string): GeneratedQuestion[] {
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Câu|Question|Q|Bài)\s*\d+)/i).filter(Boolean);
  const questions: GeneratedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let stem = "";
    let answerKey = "";

    for (const line of lines) {
      const cleanLine = line.replace(/^\s*\*\*\s*/, "").replace(/\s*\*\*\s*$/, "").trim();
      const ansMatch = cleanLine.match(/^(?:Hướng dẫn giải|Đáp án mẫu|Lời giải)\s*[\).:-]\s*(.*)$/i);
      if (ansMatch) {
        answerKey = ansMatch[1].trim();
      } else {
        stem += (stem ? "\n" : "") + line;
      }
    }

    stem = stripQuestionPrefix(stem);

    if (stem) {
      questions.push({
        type: "essay",
        question: stem,
        answer_key: answerKey,
        ai_solve_status: "unsolved",
      });
    }
  }

  return questions;
}


// ----------------------------------------------------
// LLM EXTRACTION FOR ALL TYPES
// ----------------------------------------------------

async function callGroqExtract(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Thiếu GROQ_API_KEY");

  aiLog("info", "GROQ-API", "🤖 AI đang thực thi: Provider = Groq | Model = llama-3.3-70b-versatile");
  const res = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    },
    12000
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return extractAssistantText(data.choices?.[0]?.message?.content || "");
}

async function callOpenRouterExtract(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    const models = OPENROUTER_EXTRACT_MODELS.length > 0 ? OPENROUTER_EXTRACT_MODELS : [OPENROUTER_EXTRACT_MODEL];

    let lastError: Error | null = null;
    for (const model of models) {
      if (!model) continue;
      for (let attempt = 1; attempt <= EXTRACT_MODEL_RETRIES; attempt++) {
        try {
          aiLog("info", "OPENROUTER-API", `🤖 AI đang thực thi: Provider = OpenRouter | Model = ${model} (lần thử ${attempt})`);
          const res = await fetchWithTimeout(
            OPENROUTER_BASE_URL,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://dbaq-lms.vercel.app",
                "X-Title": "DBAQ LMS",
              },
              body: JSON.stringify({
                model,
                temperature: 0.1,
                max_tokens: 1200,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: prompt },
                ],
              }),
            },
            AI_TIMEOUT_MS
          );

          if (!res.ok) {
            const body = await res.text();
            lastError = new Error(`OpenRouter ${model} error ${res.status}: ${body}`);
            continue;
          }

          const data = await res.json();
          const raw = extractAssistantText(data.choices?.[0]?.message?.content || "");
          if (raw.trim()) return raw;
        } catch (err) {
          lastError = err as Error;
        }
      }
    }
  }

  // Fallback to Groq API if GROQ_API_KEY is configured
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroqExtract(prompt, systemPrompt);
    } catch (groqErr) {
      console.warn("Groq fallback also failed:", groqErr);
    }
  }

  throw new Error("Không thể kết nối dịch vụ AI (OpenRouter / Groq)");
}

function normalizeGeneratedQuestions(raw: unknown, questionType: QuestionType): GeneratedQuestion[] {
  if (!Array.isArray(raw)) return [];

  const result: GeneratedQuestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const stem = stripQuestionPrefix(String(q.question || q.stem || "").trim());
    if (!stem) continue;

    if (questionType === "mcq") {
      const opts = (q.options || {}) as Record<string, unknown>;
      const optionsRecord: Record<"A" | "B" | "C" | "D", string> = {
        A: stripOptionPrefix(String(opts.A || opts.a || "").trim(), "A"),
        B: stripOptionPrefix(String(opts.B || opts.b || "").trim(), "B"),
        C: stripOptionPrefix(String(opts.C || opts.c || "").trim(), "C"),
        D: stripOptionPrefix(String(opts.D || opts.d || "").trim(), "D"),
      };
      const correctRaw = String(q.correct_answer || q.answerKey || q.answer || "A").toUpperCase();
      const correct_answer = ["A", "B", "C", "D"].includes(correctRaw)
        ? (correctRaw as "A" | "B" | "C" | "D")
        : "A";

      result.push({
        type: "mcq",
        question: stem,
        options: optionsRecord,
        correct_answer,
        ai_solve_status: "solved",
      });
    } else if (questionType === "true_false") {
      const rawSubs = (q.sub_questions || q.subQuestions || q.statements || []) as Array<Record<string, unknown>>;
      const subQuestions: GeneratedSubQuestion[] = rawSubs.map((sub, idx) => {
        const subContent = stripSubQuestionPrefix(String(sub.content || sub.statement || sub.text || "").trim());
        const keyRaw = String(sub.answerKey || sub.answer_key || sub.correct_answer || sub.answer || "true").toLowerCase();
        const isFalse = keyRaw === "false" || keyRaw === "sai" || keyRaw === "f";
        return {
          id: crypto.randomUUID(),
          content: subContent,
          answerKey: isFalse ? "false" : "true",
          order: idx + 1,
        };
      });

      result.push({
        type: "true_false",
        question: stem,
        sub_questions: subQuestions,
        ai_solve_status: "solved",
      });
    } else if (questionType === "short_answer") {
      result.push({
        type: "short_answer",
        question: stem,
        answer_key: "",
        ai_solve_status: "unsolved",
      });
    } else if (questionType === "essay") {
      const ansKey = String(q.answer_key || q.answerKey || q.explanation || q.solution || "").trim();
      result.push({
        type: "essay",
        question: stem,
        answer_key: ansKey,
        ai_solve_status: "solved",
      });
    }
  }

  return result;
}

async function solveQuestionsAnswersBatch(
  questions: GeneratedQuestion[]
): Promise<GeneratedQuestion[]> {
  if (!questions || questions.length === 0) return questions;

  const apiKey = process.env.OPENROUTER_API_KEY;
  const solvePrompt = `Giải & chọn đáp án đúng cho từng câu. Trả về DUY NHẤT mảng JSON theo thứ tự id:
${JSON.stringify(
  questions.map((q, idx) => ({
    id: idx + 1,
    type: q.type,
    question: q.question,
    options: q.options,
    sub_questions: q.sub_questions?.map((s) => s.content),
  }))
)}

Schema JSON bắt buộc (KHÔNG kèm lời giải dài dòng):
[
  { "id": 1, "correct_answer": "A", "sub_answers": ["true", "false"], "short_answer": "12" }
]
`;

  let rawText = "";

  try {
    if (apiKey) {
      const models = OPENROUTER_SOLVE_MODELS.length > 0 ? OPENROUTER_SOLVE_MODELS : [OPENROUTER_SOLVE_MODEL];

      for (const model of models) {
        if (!model || rawText.trim()) continue;
        try {
          aiLog("info", "SOLVER-API", `🧠 Đang tính toán giải đáp án cho ${questions.length} câu | Provider = OpenRouter | Model = ${model}`);
          const res = await fetchWithTimeout(
            OPENROUTER_BASE_URL,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://dbaq-lms.vercel.app",
                "X-Title": "DBAQ LMS",
              },
              body: JSON.stringify({
                model,
                temperature: 0.0,
                max_tokens: 500,
                messages: [
                  {
                    role: "system",
                    content:
                      "Bạn là chuyên gia giải toán trắc nghiệm chính xác. Trả về duy nhất mảng JSON chứa kết quả tính toán đúng.",
                  },
                  { role: "user", content: solvePrompt },
                ],
              }),
            },
            25000
          );

          if (res.ok) {
            const data = await res.json();
            rawText = extractAssistantText(data.choices?.[0]?.message?.content || "");
            if (rawText.trim()) break;
          } else {
            aiLog("warn", "SOLVER", `OpenRouter solver HTTP ${res.status} (Hết token/lỗi mô hình ${model})`);
          }
        } catch (orErr) {
          aiLog("warn", "SOLVER", `OpenRouter solver timed out on ${model}`, { error: (orErr as Error).message });
        }
      }
    }

    if (!rawText.trim() && process.env.GROQ_API_KEY) {
      try {
        aiLog("info", "SOLVER-API", `🧠 Đang tính toán giải đáp án cho ${questions.length} câu | Provider = Groq | Model = llama-3.3-70b-versatile`);
        rawText = await callGroqExtract(
          solvePrompt,
          "Bạn là chuyên gia giải toán trắc nghiệm chính xác. Trả về duy nhất mảng JSON chứa kết quả tính toán đúng."
        );
      } catch (groqErr) {
        aiLog("warn", "SOLVER", "Groq solver fallback failed", { error: (groqErr as Error).message });
      }
    }

    if (!rawText.trim()) return questions;

    const parsed = parseJsonLenient(rawText) as any[];

    if (!Array.isArray(parsed)) return questions;

    return questions.map((q, idx) => {
      const sol = parsed.find((p) => p.id === idx + 1 || p.id === idx) || parsed[idx];
      if (!sol) return q;

      if (q.type === "mcq") {
        const ans = String(sol.correct_answer || sol.answer || "A").toUpperCase();
        const validAns = ["A", "B", "C", "D"].includes(ans) ? (ans as "A" | "B" | "C" | "D") : q.correct_answer || "A";
        return { ...q, correct_answer: validAns, ai_solve_status: "solved" };
      }

      if (q.type === "true_false" && q.sub_questions) {
        const subAnsArr = Array.isArray(sol.sub_answers) ? sol.sub_answers : Array.isArray(sol.answers) ? sol.answers : [];
        const nextSubs = q.sub_questions.map((sub, sIdx) => {
          const rawVal = String(subAnsArr[sIdx] || "").toLowerCase();
          const isFalse = rawVal === "false" || rawVal === "sai" || rawVal === "f";
          const isTrue = rawVal === "true" || rawVal === "đúng" || rawVal === "dung" || rawVal === "t";
          const finalKey = isFalse ? "false" : isTrue ? "true" : sub.answerKey;
          return { ...sub, answerKey: finalKey as "true" | "false" };
        });
        return { ...q, sub_questions: nextSubs, ai_solve_status: "solved" };
      }

      if (q.type === "short_answer") {
        const ansKey = String(sol.short_answer || sol.answer_key || sol.correct_answer || sol.answer || q.answer_key || "").trim();
        return { ...q, answer_key: ansKey, ai_solve_status: "solved" };
      }

      if (q.type === "essay") {
        const ansKey = String(sol.explanation || sol.answer_key || sol.solution || q.answer_key || "").trim();
        return { ...q, answer_key: ansKey, ai_solve_status: "solved" };
      }

      return q;
    });
  } catch (err) {
    aiLog("warn", "SOLVER", "Batch answer solving failed", { error: (err as Error).message });
    return questions;
  }
}

// ----------------------------------------------------
// MAIN ENTRY POINT
// ----------------------------------------------------

export async function buildQuestionsFromText(
  manualText: string,
  questionType: QuestionType = "mcq"
): Promise<{ cleanedText: string; questions: GeneratedQuestion[] }> {
  const cleanedText = manualText.trim();
  if (!cleanedText) {
    throw new Error("Không có nội dung để xử lý");
  }

  let systemPrompt = "";
  let userPrompt = "";

  if (questionType === "mcq") {
    systemPrompt = `Bạn là chuyên gia trích xuất & biên soạn câu hỏi trắc nghiệm MCQ tiếng Việt cho hệ thống LMS.
Nhiệm vụ: Phân tích văn bản nguồn hoặc yêu cầu của người dùng, trích xuất hoặc sáng tạo các câu hỏi trắc nghiệm MCQ 4 lựa chọn (A, B, C, D).
BẮT BUỘC trả về JSON mảng duy nhất theo đúng schema:
[
  {
    "type": "mcq",
    "question": "Nội dung câu hỏi...",
    "options": {
      "A": "Lựa chọn A",
      "B": "Lựa chọn B",
      "C": "Lựa chọn C",
      "D": "Lựa chọn D"
    },
    "correct_answer": "A"
  }
]
Quy tắc:
1. KHÔNG được lặp lại tiền tố "Câu 1:", "**Câu 1:**" trong trường "question".
2. Nhận diện và chuyển các bảng dữ liệu (bảng giá trị, bảng biến thiên) thành BẢNG MARKDOWN chuẩn (ví dụ: | Cột 1 | Cột 2 |\n|---|---|\n| Ô 1 | Ô 2 |) trong phần "question".
3. Giữ nguyên công thức Toán LaTeX (ví dụ: $...$, \\(...\\), \\frac{a}{b}).`;

    userPrompt = `Bóc tách/tạo các câu hỏi trắc nghiệm MCQ từ văn bản sau:\n\n${cleanedText}`;
  } else if (questionType === "true_false") {
    systemPrompt = `Bạn là chuyên gia trích xuất & biên soạn câu hỏi Đúng/Sai tiếng Việt cho hệ thống LMS.
Nhiệm vụ: Phân tích văn bản nguồn hoặc yêu cầu của người dùng, trích xuất hoặc sáng tạo các câu hỏi Đúng/Sai.
Mỗi câu hỏi Đúng/Sai gồm 1 phần thân câu hỏi chính "question" (dẫn dắt) và mảng "sub_questions" chứa từ 2-4 ý/mệnh đề (a, b, c, d), kèm theo "answerKey" ("true" nếu Đúng, "false" nếu Sai).
BẮT BUỘC trả về JSON mảng duy nhất theo đúng schema:
[
  {
    "type": "true_false",
    "question": "Nội dung thân câu hỏi dẫn dắt (ví dụ: Khi đu quay hoạt động... Các mệnh đề sau đúng hay sai?)",
    "sub_questions": [
      { "content": "Giá trị lớn nhất của v_x bằng 0,3.", "answerKey": "true" },
      { "content": "Giá trị nhỏ nhất của v_x - 1 bằng 0,3 - 1.", "answerKey": "false" },
      { "content": "Tổng giá trị lớn nhất...", "answerKey": "true" },
      { "content": "Trong vòng quay đầu tiên...", "answerKey": "false" }
    ]
  }
]
Quy tắc:
1. KHÔNG lặp tiền tố "Câu 1:" trong "question".
2. KHÔNG chèn nhãn "a)", "b)", "c)", "d)" vào trong "content" của sub_questions (hệ thống sẽ tự đánh nhãn a, b, c, d).
3. Nhận diện bảng dữ liệu và chuyển thành Markdown Table. Giữ nguyên Math/LaTeX.`;

    userPrompt = `Bóc tách/tạo các câu hỏi Đúng/Sai từ văn bản sau:\n\n${cleanedText}`;
  } else if (questionType === "short_answer") {
    systemPrompt = `Bạn là chuyên gia trích xuất & biên soạn câu hỏi Trả lời ngắn tiếng Việt cho hệ thống LMS.
Nhiệm vụ: Phân tích văn bản nguồn hoặc yêu cầu, trích xuất hoặc sáng tạo các câu hỏi yêu cầu học sinh tính toán và nhập đáp án ngắn (số hoặc biểu thức ngắn gọn).
BẮT BUỘC trả về JSON mảng duy nhất theo đúng schema:
[
  {
    "type": "short_answer",
    "question": "Nội dung câu hỏi...",
    "answer_key": "Đáp án ngắn (ví dụ: 12 hoặc 25 hoặc 10,79)"
  }
]
Quy tắc:
1. KHÔNG lặp tiền tố "Câu 1:" trong "question".
2. "answer_key" chỉ chứa kết quả ngắn gọn (số, phân số tối giản, hoặc từ ngắn).
3. Nhận diện bảng dữ liệu và chuyển thành Markdown Table. Giữ nguyên Math/LaTeX.`;

    userPrompt = `Bóc tách/tạo các câu hỏi Trả lời ngắn từ văn bản sau:\n\n${cleanedText}`;
  } else if (questionType === "essay") {
    systemPrompt = `Bạn là chuyên gia trích xuất & biên soạn câu hỏi Tự luận tiếng Việt cho hệ thống LMS.
Nhiệm vụ: Phân tích văn bản nguồn hoặc yêu cầu, trích xuất hoặc sáng tạo các câu hỏi Tự luận.
BẮT BUỘC trả về JSON mảng duy nhất theo đúng schema:
[
  {
    "type": "essay",
    "question": "Nội dung câu hỏi tự luận...",
    "answer_key": "Hướng dẫn chấm / đáp án gợi ý chi tiết nếu có"
  }
]
Quy tắc:
1. KHÔNG lặp tiền tố "Câu 1:" trong "question".
2. Nhận diện bảng dữ liệu và chuyển thành Markdown Table. Giữ nguyên Math/LaTeX.`;

    userPrompt = `Bóc tách/tạo các câu hỏi Tự luận từ văn bản sau:\n\n${cleanedText}`;
  }

  let questions: GeneratedQuestion[] = [];

  // Step 1: Instant Heuristic Parse (takes ~0.001s if user pasted an existing exam paper)
  if (questionType === "mcq") {
    questions = parseHeuristicMcq(cleanedText);
  } else if (questionType === "true_false") {
    questions = parseHeuristicTrueFalse(cleanedText);
  } else if (questionType === "short_answer") {
    questions = parseHeuristicShortAnswer(cleanedText);
  } else if (questionType === "essay") {
    questions = parseHeuristicEssay(cleanedText);
  }

  // Step 2: Call AI LLM if text is a prompt/unstructured instruction or heuristic returned 0 questions
  if (questions.length === 0) {
    try {
      const rawAiOutput = await callOpenRouterExtract(userPrompt, systemPrompt);
      const parsedJson = parseJsonLenient(rawAiOutput);
      questions = normalizeGeneratedQuestions(parsedJson, questionType);
    } catch (err) {
      aiLog("warn", "EXTRACT", "AI extraction failed", {
        error: (err as Error).message,
      });
    }
  }

  // Step 3: Fast Batch AI Answer Solving (solves math problems to set exact correct_answer & true/false keys in 1-2s)
  if (questions.length > 0) {
    questions = await solveQuestionsAnswersBatch(questions);
  }

  if (questions.length === 0) {
    // Ultimate fallback: return single question containing input text
    questions = [
      {
        type: questionType,
        question: stripQuestionPrefix(cleanedText),
        options: questionType === "mcq" ? { A: "", B: "", C: "", D: "" } : undefined,
        correct_answer: questionType === "mcq" ? "A" : undefined,
        sub_questions:
          questionType === "true_false"
            ? [
              { id: crypto.randomUUID(), content: "Mệnh đề a", answerKey: "true", order: 1 },
              { id: crypto.randomUUID(), content: "Mệnh đề b", answerKey: "false", order: 2 },
            ]
            : undefined,
        answer_key: "",
        ai_solve_status: "unsolved",
      },
    ];
  }

  // Render Math/LaTeX for questions and subquestions and strip any residual leading prefixes
  const formattedQuestions = questions.map((q) => {
    const cleanStem = stripQuestionPrefix(q.question);
    const stemFormatted = formatMathForRender(cleanStem);
    if (q.type === "mcq" && q.options) {
      return {
        ...q,
        question: stemFormatted,
        options: {
          A: formatMathForRender(stripOptionPrefix(q.options.A || "", "A")),
          B: formatMathForRender(stripOptionPrefix(q.options.B || "", "B")),
          C: formatMathForRender(stripOptionPrefix(q.options.C || "", "C")),
          D: formatMathForRender(stripOptionPrefix(q.options.D || "", "D")),
        },
      };
    }
    if (q.type === "true_false" && q.sub_questions) {
      return {
        ...q,
        question: stemFormatted,
        sub_questions: q.sub_questions.map((sub) => ({
          ...sub,
          content: formatMathForRender(stripSubQuestionPrefix(sub.content)),
        })),
      };
    }
    return {
      ...q,
      question: stemFormatted,
      answer_key: q.answer_key ? formatMathForRender(q.answer_key) : "",
    };
  });

  return {
    cleanedText,
    questions: formattedQuestions,
  };
}


export async function buildQuestionsFromUploads(
  _files: File[],
  manualText: string
): Promise<{ cleanedText: string; questions: GeneratedQuestion[]; sources: Array<{ name: string; chars: number; kind: string }> }> {
  const result = await buildQuestionsFromText(manualText, "mcq");
  return {
    ...result,
    sources: [{ name: "text-input", chars: manualText.length, kind: "text" }],
  };
}
