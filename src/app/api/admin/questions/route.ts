import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { bulkDeleteQuestions, createQuestion, fetchQuestions } from "@/lib/supabaseHelpers";

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    if (!assignmentId) return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });

    const questions = await fetchQuestions(assignmentId, { includeAnswerKey: true });
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const normalizedBody = {
      assignmentId: body.assignmentId || body.assignment_id,
      type: body.type,
      content: body.content,
      choices: body.choices,
      answerKey: body.answerKey || body.answer_key,
      imageUrl: body.imageUrl || body.image_url,
      points: body.points !== undefined ? Number(body.points) : undefined,
      subQuestions: body.subQuestions || body.sub_questions,
    };
    const question = await createQuestion(normalizedBody);
    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: error?.message || "Failed to create question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { questionIds, assignmentId } = body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "Missing or invalid questionIds array" }, { status: 400 });
    }

    if (!assignmentId || typeof assignmentId !== "string") {
      return NextResponse.json({ error: "Missing or invalid assignmentId" }, { status: 400 });
    }

    await bulkDeleteQuestions(questionIds, assignmentId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk deleting questions:", error);
    return NextResponse.json({ error: "Failed to bulk delete questions" }, { status: 500 });
  }
}
