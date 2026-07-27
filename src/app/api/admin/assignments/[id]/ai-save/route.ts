import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createQuestion } from "@/lib/supabaseHelpers";
import { createClient } from "@supabase/supabase-js";

type AiQuestion = {
  type?: "mcq" | "true_false" | "short_answer" | "essay";
  question: string;
  options?: Record<"A" | "B" | "C" | "D", string>;
  correct_answer?: "A" | "B" | "C" | "D";
  sub_questions?: Array<{ id?: string; content: string; answerKey: "true" | "false"; order?: number }>;
  subQuestions?: Array<{ id?: string; content: string; answerKey: "true" | "false"; order?: number }>;
  answer_key?: string;
  answerKey?: string;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildFingerprint(question: AiQuestion): string {
  const qType = question.type || "mcq";
  const stem = normalizeText(question.question || "");
  if (qType === "mcq") {
    const options = question.options || { A: "", B: "", C: "", D: "" };
    return [
      qType,
      stem,
      normalizeText(options.A || ""),
      normalizeText(options.B || ""),
      normalizeText(options.C || ""),
      normalizeText(options.D || ""),
    ].join("||");
  }
  if (qType === "true_false") {
    const subs = question.subQuestions || question.sub_questions || [];
    const subStr = subs.map((s) => normalizeText(s.content)).join("|");
    return [qType, stem, subStr].join("||");
  }
  return [qType, stem, normalizeText(question.answer_key || question.answerKey || "")].join("||");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: assignmentId } = await params;
    const body = await req.json();
    const aiQuestions = (body?.aiQuestions || []) as AiQuestion[];

    if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
      return NextResponse.json({ error: "No questions to save" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingRows, error: existingError } = await supabase
      .from("questions")
      .select("type, content, choices, sub_questions, answer_key")
      .eq("assignment_id", assignmentId);

    if (existingError) throw existingError;

    const seenFingerprints = new Set<string>();
    for (const row of existingRows || []) {
      const rowType = (row.type as "mcq" | "true_false" | "short_answer" | "essay") || "mcq";
      const choices = Array.isArray(row.choices) ? row.choices : [];
      const mappedOptions: Record<"A" | "B" | "C" | "D", string> = {
        A: typeof choices[0] === "string" ? choices[0] : "",
        B: typeof choices[1] === "string" ? choices[1] : "",
        C: typeof choices[2] === "string" ? choices[2] : "",
        D: typeof choices[3] === "string" ? choices[3] : "",
      };
      seenFingerprints.add(
        buildFingerprint({
          type: rowType,
          question: row.content || "",
          options: mappedOptions,
          sub_questions: Array.isArray(row.sub_questions) ? row.sub_questions : [],
          answer_key: row.answer_key || "",
        })
      );
    }

    const created = [];
    let skippedDuplicates = 0;

    for (const q of aiQuestions) {
      const qType = q.type || "mcq";
      const fingerprint = buildFingerprint(q);
      if (seenFingerprints.has(fingerprint)) {
        skippedDuplicates += 1;
        continue;
      }

      if (qType === "mcq") {
        const choices = q.options
          ? [q.options.A || "", q.options.B || "", q.options.C || "", q.options.D || ""]
          : undefined;

        const createdQuestion = await createQuestion({
          assignmentId,
          type: "mcq",
          content: (q.question || "").trim(),
          choices,
          answerKey: q.correct_answer || q.answerKey || "A",
        });
        created.push(createdQuestion);
      } else if (qType === "true_false") {
        const rawSubs = q.subQuestions || q.sub_questions || [];
        const mappedSubs = rawSubs.map((sub, idx) => ({
          id: sub.id || crypto.randomUUID(),
          content: sub.content || "",
          answerKey: (sub.answerKey === "false" ? "false" : "true") as "true" | "false",
          order: sub.order || idx + 1,
        }));

        const createdQuestion = await createQuestion({
          assignmentId,
          type: "true_false",
          content: (q.question || "").trim(),
          subQuestions: mappedSubs,
        });
        created.push(createdQuestion);
      } else if (qType === "short_answer") {
        const createdQuestion = await createQuestion({
          assignmentId,
          type: "short_answer",
          content: (q.question || "").trim(),
          answerKey: q.answer_key || q.answerKey || "",
        });
        created.push(createdQuestion);
      } else if (qType === "essay") {
        const createdQuestion = await createQuestion({
          assignmentId,
          type: "essay",
          content: (q.question || "").trim(),
          answerKey: q.answer_key || q.answerKey || "",
        });
        created.push(createdQuestion);
      }

      seenFingerprints.add(fingerprint);
    }

    return NextResponse.json({
      ok: true,
      count: created.length,
      skippedDuplicates,
      questions: created,
    });
  } catch (error) {
    console.error("Error saving AI questions:", error);
    return NextResponse.json({ error: "Failed to save AI questions" }, { status: 500 });
  }
}

