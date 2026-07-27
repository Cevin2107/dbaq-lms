import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { buildQuestionsFromText, QuestionType } from "@/lib/aiGeneration";

export const runtime = "nodejs";
export const maxDuration = 120;

function classifyAiError(error: unknown): { status: number; publicMessage: string; code: string } {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message.includes("Thiếu OPENROUTER_API_KEY")) {
    return {
      status: 503,
      publicMessage: "Server chưa cấu hình OPENROUTER_API_KEY trên môi trường deploy.",
      code: "MISSING_OPENROUTER_KEY",
    };
  }

  if (message.includes("OpenRouter 401") || message.includes("Groq text 401")) {
    return {
      status: 502,
      publicMessage: "AI provider từ chối xác thực. Kiểm tra lại API key trên server.",
      code: "AI_PROVIDER_AUTH_FAILED",
    };
  }

  if (message.includes("AI did not return any questions")) {
    return {
      status: 422,
      publicMessage:
        "AI chưa trích xuất hoặc tạo được câu hỏi từ văn bản đã nhập. Vui lòng kiểm tra lại nội dung dán vào hoặc định dạng câu hỏi.",
      code: "AI_EMPTY_RESULT",
    };
  }

  return {
    status: 500,
    publicMessage: "Không thể tạo câu hỏi bằng AI lúc này, vui lòng thử lại sau.",
    code: "AI_GENERATION_FAILED",
  };
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let manualText = "";
    let questionType: QuestionType = "mcq";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      manualText = (body.manualText || body.textInput || "").trim();
      if (body.questionType && ["mcq", "true_false", "short_answer", "essay"].includes(body.questionType)) {
        questionType = body.questionType as QuestionType;
      }
    } else {
      const formData = await req.formData();
      manualText = ((formData.get("manualText") as string) || (formData.get("textInput") as string) || "").trim();
      const rawType = formData.get("questionType") as string;
      if (rawType && ["mcq", "true_false", "short_answer", "essay"].includes(rawType)) {
        questionType = rawType as QuestionType;
      }
    }

    if (!manualText) {
      return NextResponse.json(
        { error: "Vui lòng dán văn bản hoặc nhập yêu cầu để AI tạo câu hỏi." },
        { status: 400 }
      );
    }

    const { cleanedText, questions } = await buildQuestionsFromText(manualText, questionType);

    return NextResponse.json({ cleanedText, questions, questionType });
  } catch (error) {
    console.error("AI generation error", error);
    const isDev = process.env.NODE_ENV !== "production";
    const message = error instanceof Error ? error.message : "Unknown error";
    const errorWithDetails = error as { details?: string };
    const details = errorWithDetails?.details || undefined;
    const classified = classifyAiError(error);
    return NextResponse.json(
      {
        error: isDev ? message : classified.publicMessage,
        details: isDev ? details : undefined,
        code: classified.code,
      },
      { status: isDev ? 500 : classified.status }
    );
  }
}

