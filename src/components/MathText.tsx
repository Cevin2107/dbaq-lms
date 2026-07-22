import katex from "katex";
import React from "react";

interface MathTextProps {
  text: string;
  className?: string;
}

interface TableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
  alignments: ("left" | "center" | "right")[];
}

interface ContentBlock {
  type: "content";
  value: string;
}

type TextBlock = TableBlock | ContentBlock;

function parseMarkdownTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseAlignments(sepLine: string): ("left" | "center" | "right")[] {
  const cells = parseMarkdownTableCells(sepLine);
  return cells.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(trimmed);
}

function isPipeTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(?:\*\*)?(?:Câu|Question)\s*\d+/i.test(trimmed)) return false;
  if (/^[A-D]\s*[\).:-]/i.test(trimmed)) return false;
  if (trimmed.startsWith("|") && (trimmed.endsWith("|") || trimmed.includes("|"))) return true;
  const count = (trimmed.match(/\|/g) || []).length;
  return count >= 2;
}

function splitTabularLine(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.includes("|")) {
    return parseMarkdownTableCells(line);
  }
  if (trimmed.includes("\t")) {
    return trimmed.split("\t").map((c) => c.trim()).filter(Boolean);
  }
  return trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
}

function isTabularLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(?:\*\*)?(?:Câu|Question)\s*\d+/i.test(trimmed)) return false;
  if (/^[A-D]\s*[\).:-]/i.test(trimmed)) return false;
  if (isPipeTableLine(line)) return true;
  const cells = splitTabularLine(line);
  return cells.length >= 2;
}

function splitMarkdownTableBlocks(text: string): TextBlock[] {
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const blocks: TextBlock[] = [];
  let currentTextLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

    // Case 1: Standard Markdown Table (with separator row)
    if (nextLine && line.includes("|") && isTableSeparatorLine(nextLine)) {
      if (currentTextLines.length > 0) {
        blocks.push({ type: "content", value: currentTextLines.join("\n") });
        currentTextLines = [];
      }

      const headers = parseMarkdownTableCells(line);
      const alignments = parseAlignments(nextLine);
      const rows: string[][] = [];

      i += 2; // Skip header and separator

      while (i < lines.length && lines[i].includes("|") && lines[i].trim().length > 0 && !isTableSeparatorLine(lines[i])) {
        rows.push(parseMarkdownTableCells(lines[i]));
        i++;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
        alignments,
      });
      continue;
    }

    // Case 2: Pipe Table without separator row
    if (nextLine && isPipeTableLine(line) && isPipeTableLine(nextLine)) {
      if (currentTextLines.length > 0) {
        blocks.push({ type: "content", value: currentTextLines.join("\n") });
        currentTextLines = [];
      }

      const headers = parseMarkdownTableCells(line);
      const rows: string[][] = [];

      i += 1; // Move to next line (first data row)

      while (i < lines.length && isPipeTableLine(lines[i])) {
        rows.push(parseMarkdownTableCells(lines[i]));
        i++;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
        alignments: headers.map(() => "left"),
      });
      continue;
    }

    // Case 3: Tab or Multi-space Tabular data
    if (nextLine && isTabularLine(line) && isTabularLine(nextLine)) {
      const headers = splitTabularLine(line);
      const nextCells = splitTabularLine(nextLine);

      if (headers.length >= 2 && Math.abs(headers.length - nextCells.length) <= 1) {
        if (currentTextLines.length > 0) {
          blocks.push({ type: "content", value: currentTextLines.join("\n") });
          currentTextLines = [];
        }

        const rows: string[][] = [];
        i += 1;

        while (i < lines.length && isTabularLine(lines[i])) {
          const rowCells = splitTabularLine(lines[i]);
          if (rowCells.length >= 2) {
            rows.push(rowCells);
            i++;
          } else {
            break;
          }
        }

        blocks.push({
          type: "table",
          headers,
          rows,
          alignments: headers.map(() => "left"),
        });
        continue;
      }
    }

    currentTextLines.push(line);
    i++;
  }

  if (currentTextLines.length > 0) {
    blocks.push({ type: "content", value: currentTextLines.join("\n") });
  }

  return blocks;
}

function humanizePlainLatex(text: string) {
  if (!text) return text;

  return text
    // Recover malformed delimiters from AI/OCR output.
    .replace(/≤ft/g, "\\left")
    .replace(/≥ight/g, "\\right")
    // Repair common OCR/AI typo for fraction command.
    .replace(/[/\\]\s*fraq/gi, "\\frac")
    .replace(/\\{2,}/g, "\\")
    // Convert common math commands to readable symbols.
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
    // Square root: \sqrt{x} => √(x)
    .replace(/\\sqrt\s*\{([^{}]+)\}/gi, "√($1)")
    // Superscript/subscript compact forms.
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/_\{([^{}]+)\}/g, "_($1)")
    // Unescape braces used in plain text.
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}");
}

function normalizeFractionsForMathDetection(text: string) {
  if (!text) return text;

  return text
    // Fix common typo first.
    .replace(/[/\\]\s*fraq/gi, "\\frac")
    // Convert simple numeric fractions into LaTeX fractions for stacked rendering.
    .replace(/(^|[^\w\\])(\d{1,4})\s*\/\s*(\d{1,4})(?=$|[^\w])/g, (_m, pre, a, b) => `${pre}\\frac{${a}}{${b}}`);
}

function ensureInlineMathDelimiters(text: string) {
  if (!text) return text;

  const protectedSegments: string[] = [];
  const placeholderPrefix = "@@MATH_SEGMENT_";
  const withPlaceholders = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g, (segment) => {
    const idx = protectedSegments.push(segment) - 1;
    return `${placeholderPrefix}${idx}@@`;
  });

  const bareLatexRegex =
    /(^|[\s(\[{:;=,+\-])((?:\\(?:frac\s*\{[^{}]+\}\s*\{[^{}]+\}|sqrt\s*\{[^{}]+\}|sum|int|lim|sin|cos|tan|log|ln|pi|alpha|beta|gamma|theta)|[A-Za-z0-9]+(?:_\{[^{}]+\}|_[A-Za-z0-9]+|\^\{[^{}]+\}|\^[A-Za-z0-9]+){1,3}))(?=($|[\s)\]}:;,.!?]))/g;

  const operatorMathRegex =
    /(^|[\s(\[{:;])((?:[A-Za-z0-9α-ωΑ-Ωπ∞()]+(?:\s*[+\-*/=×÷≤≥≠±]\s*[A-Za-z0-9α-ωΑ-Ωπ∞()]+){1,}))(?![^$]*\$)(?=($|[\s)\]}:;,.!?]))/g;

  let wrapped = withPlaceholders.replace(bareLatexRegex, (_m, leading, expr) => `${leading}$${expr}$`);
  wrapped = wrapped.replace(operatorMathRegex, (_m, leading, expr) => `${leading}$${expr.trim()}$`);

  return wrapped.replace(new RegExp(`${placeholderPrefix}(\\d+)@@`, "g"), (_m, idx) => {
    const parsed = Number.parseInt(idx, 10);
    return Number.isFinite(parsed) ? protectedSegments[parsed] || "" : "";
  });
}

function normalizeMathDelimiters(text: string) {
  if (!text) return text;

  return text
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner) => `$${inner}$`);
}

function renderLatexSegment(content: string, displayMode: boolean) {
  const normalizedContent = content
    // Recover malformed delimiters from AI/OCR output.
    .replace(/≤ft/g, "\\left")
    .replace(/≥ight/g, "\\right")
    // AI/OCR sometimes emits \\\frac or \\sqrt; KaTeX interprets leading \\ as a line break.
    .replace(/\\{2,}(?=(?:left|right|frac|sqrt|sum|int|lim|sin|cos|tan|log|ln|pi|alpha|beta|gamma|theta)\b)/g, "\\");

  try {
    return katex.renderToString(normalizedContent, {
      throwOnError: false,
      displayMode,
      output: "html",
      strict: "ignore",
    });
  } catch {
    return content;
  }
}

function splitMathSegments(text: string) {
  const normalized = ensureInlineMathDelimiters(
    normalizeFractionsForMathDetection(
      normalizeMathDelimiters(text)
      .replace(/\\\[/g, "$$")
      .replace(/\\\]/g, "$$")
      .replace(/\\\(/g, "$")
      .replace(/\\\)/g, "$")
    )
  );

  const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\\(?:frac\s*\{[^{}]+\}\s*\{[^{}]+\}|sqrt\s*\{[^{}]+\}|[a-zA-Z]+)|[A-Za-z0-9]+(?:_\{[^{}]+\}|_[A-Za-z0-9]+|\^\{[^{}]+\}|\^[A-Za-z0-9]+){1,3})/g;
  const parts: Array<{ type: "text" | "math"; value: string; displayMode?: boolean }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: humanizePlainLatex(normalized.slice(lastIndex, match.index)) });
    }

    const token = match[0];
    if (token.startsWith("$$") && token.endsWith("$$")) {
      parts.push({ type: "math", value: token.slice(2, -2).trim(), displayMode: true });
    } else if (token.startsWith("$") && token.endsWith("$")) {
      parts.push({ type: "math", value: token.slice(1, -1).trim(), displayMode: false });
    } else {
      parts.push({ type: "math", value: token.trim(), displayMode: false });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    parts.push({ type: "text", value: humanizePlainLatex(normalized.slice(lastIndex)) });
  }

  return parts;
}

function renderContentBlock(text: string, className?: string) {
  const segments = splitMathSegments(text || "");

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {segment.value}
            </span>
          );
        }

        const html = renderLatexSegment(segment.value, Boolean(segment.displayMode));
        return (
          <span
            key={index}
            className={segment.displayMode ? "my-2 block overflow-x-auto" : "inline align-baseline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}

export function MathText({ text, className }: MathTextProps) {
  if (!text) return null;

  const blocks = splitMarkdownTableBlocks(text);

  return (
    <span className={className}>
      {blocks.map((block, bIdx) => {
        if (block.type === "table") {
          return (
            <span
              key={bIdx}
              className="my-4 block overflow-x-auto rounded-[1.25rem] border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <table className="w-full min-w-max text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 dark:from-white/10 dark:via-white/5 dark:to-white/10 text-slate-900 dark:text-slate-100 font-bold">
                    {block.headers.map((h, i) => {
                      const align = block.alignments[i] || "left";
                      const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                      return (
                        <th
                          key={i}
                          className={`px-4 py-3 border-r last:border-r-0 border-slate-200/80 dark:border-white/10 ${alignClass} font-semibold tracking-tight text-slate-900 dark:text-slate-100`}
                        >
                          <MathText text={h} />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {block.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="even:bg-slate-50/50 dark:even:bg-white/[0.02] hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      {row.map((cell, ci) => {
                        const align = block.alignments[ci] || "left";
                        const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                        return (
                          <td
                            key={ci}
                            className={`px-4 py-2.5 border-r last:border-r-0 border-slate-200/60 dark:border-white/10 font-medium text-slate-700 dark:text-slate-200 ${alignClass}`}
                          >
                            <MathText text={cell} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </span>
          );
        }

        return <React.Fragment key={bIdx}>{renderContentBlock(block.value)}</React.Fragment>;
      })}
    </span>
  );
}

