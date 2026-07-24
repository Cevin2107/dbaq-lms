import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Kiểm tra xem session đã hết hạn chưa
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, serviceKey);

    // Lấy thông tin session cùng assignment
    const { data: session, error } = await supabase
      .from("student_sessions")
      .select("started_at, deadline_at, status, assignment_id, draft_answers")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Nếu đã submitted rồi thì không cần check
    if (session.status === "submitted") {
      return NextResponse.json({ 
        expired: false, 
        message: "Already submitted",
        startedAt: session.started_at,
        deadlineAt: session.deadline_at
      });
    }

    const { data: assignment } = await supabase
      .from("assignments")
      .select("duration_minutes, due_at")
      .eq("id", session.assignment_id)
      .single();

    const now = new Date();
    const draftAnswers = (session.draft_answers as Record<string, unknown>) || {};
    const sessionMeta = (draftAnswers.__sessionMeta as { activeSince?: string | null; activeDurationSeconds?: number | null }) || {};
    const activeSince = sessionMeta.activeSince;
    const activeDurationSeconds = Math.max(0, Math.floor(Number(sessionMeta.activeDurationSeconds ?? 0)));

    const activeSinceMs = activeSince ? new Date(activeSince).getTime() : NaN;
    const currentStretch = (session.status === "active" && Number.isFinite(activeSinceMs))
      ? Math.max(0, Math.floor((now.getTime() - activeSinceMs) / 1000))
      : 0;

    const totalActiveSeconds = activeDurationSeconds + currentStretch;

    let workRemainingSeconds: number | null = null;
    if (assignment?.duration_minutes) {
      workRemainingSeconds = Math.max(0, Math.floor(assignment.duration_minutes * 60 - totalActiveSeconds));
    }

    let dueRemainingSeconds: number | null = null;
    if (assignment?.due_at) {
      const dueAtMs = new Date(assignment.due_at).getTime();
      dueRemainingSeconds = Math.max(0, Math.floor((dueAtMs - now.getTime()) / 1000));
    }

    let remainingSeconds: number | null = null;
    if (workRemainingSeconds !== null && dueRemainingSeconds !== null) {
      remainingSeconds = Math.min(workRemainingSeconds, dueRemainingSeconds);
    } else if (workRemainingSeconds !== null) {
      remainingSeconds = workRemainingSeconds;
    } else if (dueRemainingSeconds !== null) {
      remainingSeconds = dueRemainingSeconds;
    }

    const expired = remainingSeconds !== null ? remainingSeconds <= 0 : false;
    const dynamicDeadlineAt = remainingSeconds !== null
      ? new Date(now.getTime() + remainingSeconds * 1000).toISOString()
      : session.deadline_at;

    return NextResponse.json({ 
      expired,
      remainingSeconds,
      startedAt: session.started_at,
      deadlineAt: dynamicDeadlineAt,
      currentTime: now.toISOString()
    });
  } catch (err) {
    console.error("Error checking deadline:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
