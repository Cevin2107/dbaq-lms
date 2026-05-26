import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";
import { getSessionDurationSeconds } from "@/lib/sessionTime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, serviceKey);

    // Lấy thông tin session
    const { data: session, error: sessionError } = await supabase
      .from("student_sessions")
      .select(`
        id,
        student_name,
        status,
        exit_count,
        started_at,
        last_activity_at,
        draft_answers,
        assignment_id,
        assignments!inner (
          id,
          title,
          subject,
          grade
        )
      `)
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Lấy tất cả câu hỏi của assignment
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("assignment_id", session.assignment_id)
      .order("order", { ascending: true });

    if (questionsError) throw questionsError;

    const draftAnswers = session.draft_answers || {};
  const durationSeconds = getSessionDurationSeconds(session as { status?: string; started_at?: string; draft_answers?: Record<string, unknown> | null });

    // Map câu hỏi với draft answers
    const questionDetails = (questions || []).map((q: { id: string; order: number; type: string; content: string; choices?: string[]; answer_key?: string; points: number; image_url?: string; sub_questions?: unknown }) => {
      const studentAnswer = draftAnswers[q.id] || null;
      const isCorrect = q.type === "mcq" && studentAnswer ? studentAnswer === q.answer_key : null;
      
      return {
        questionId: q.id,
        order: q.order,
        type: q.type,
        content: q.content,
        choices: q.choices,
        correctAnswer: q.answer_key,
        points: q.points,
        imageUrl: q.image_url,
        subQuestions: q.sub_questions || null,
        studentAnswer: studentAnswer,
        isCorrect: isCorrect,
        pointsAwarded: 0,
      };
    });

    const assignmentData = session.assignments as { title?: string; subject?: string; grade?: string } | undefined;

    return NextResponse.json({
      student_name: session.student_name,
      started_at: session.started_at,
      status: session.status,
      durationSeconds,
      assignment_title: assignmentData?.title || "N/A",
      subject: assignmentData?.subject || "N/A",
      grade: assignmentData?.grade || "N/A",
      draft_answers: draftAnswers,
      session: {
        studentName: session.student_name,
        assignmentTitle: assignmentData?.title || "N/A",
        startedAt: session.started_at,
        lastActivityAt: session.last_activity_at,
        status: session.status,
        exitCount: session.exit_count || 0,
        durationSeconds,
        questionsAnswered: Object.keys(draftAnswers).length,
      },
      questions: questionDetails,
    });
  } catch (error) {
    console.error("Error fetching session detail:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
