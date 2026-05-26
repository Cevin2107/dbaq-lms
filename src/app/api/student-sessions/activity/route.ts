import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSessionMeta(draftAnswers: unknown) {
  if (!draftAnswers || typeof draftAnswers !== "object") {
    return { activeSince: null as string | null, activeDurationSeconds: 0 };
  }

  const sessionMeta = (draftAnswers as Record<string, unknown>).__sessionMeta;
  if (!sessionMeta || typeof sessionMeta !== "object") {
    return { activeSince: null as string | null, activeDurationSeconds: 0 };
  }

  const meta = sessionMeta as { activeSince?: string | null; activeDurationSeconds?: number | null };
  return {
    activeSince: meta.activeSince ?? null,
    activeDurationSeconds: Math.max(0, Math.floor(Number(meta.activeDurationSeconds ?? 0))),
  };
}

function setSessionMeta(draftAnswers: unknown, activeSince: string | null) {
  const answers = draftAnswers && typeof draftAnswers === "object" ? { ...(draftAnswers as Record<string, unknown>) } : {};
  const existingMeta = getSessionMeta(answers);
  answers.__sessionMeta = {
    activeDurationSeconds: existingMeta.activeDurationSeconds,
    activeSince,
  };
  return answers;
}

// PATCH: Cập nhật last_activity_at khi học sinh có hoạt động
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, serviceKey);

    const { data: currentSession } = await supabase
      .from("student_sessions")
      .select("status, draft_answers")
      .eq("id", sessionId)
      .single();

    // Cập nhật last_activity_at
    const updateData: { last_activity_at: string; draft_answers?: Record<string, unknown> } = {
      last_activity_at: new Date().toISOString(),
    };

    const { activeSince } = getSessionMeta(currentSession?.draft_answers);
    if (currentSession?.status === "active" && !activeSince) {
      updateData.draft_answers = setSessionMeta(currentSession?.draft_answers, updateData.last_activity_at);
    }

    const { error } = await supabase
      .from("student_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      console.error("Activity update error:", error);
      return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating activity:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
