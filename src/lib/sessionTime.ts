export type SessionTimingLike = {
  status?: "active" | "exited" | "submitted" | string;
  started_at?: string | null;
  active_since?: string | null;
  active_duration_seconds?: number | null;
  draft_answers?: Record<string, unknown> | null;
};

function getSessionMeta(session: SessionTimingLike) {
  const draftAnswers = session.draft_answers && typeof session.draft_answers === "object"
    ? session.draft_answers as Record<string, unknown>
    : {};
  const meta = draftAnswers.__sessionMeta && typeof draftAnswers.__sessionMeta === "object"
    ? draftAnswers.__sessionMeta as { activeSince?: string | null; activeDurationSeconds?: number | null }
    : {};

  return {
    activeSince: session.active_since ?? meta.activeSince ?? null,
    activeDurationSeconds: session.active_duration_seconds ?? meta.activeDurationSeconds ?? 0,
  };
}

export function getSessionDurationSeconds(session: SessionTimingLike, nowMs = Date.now()): number {
  const { activeSince, activeDurationSeconds } = getSessionMeta(session);
  const accumulatedSeconds = Math.max(0, Math.floor(Number(activeDurationSeconds ?? 0)));

  if (session.status === "active") {
    const activeSinceMs = activeSince ? new Date(activeSince).getTime() : NaN;
    if (Number.isFinite(activeSinceMs)) {
      return accumulatedSeconds + Math.max(0, Math.floor((nowMs - activeSinceMs) / 1000));
    }

    const startedAtMs = session.started_at ? new Date(session.started_at).getTime() : NaN;
    if (Number.isFinite(startedAtMs)) {
      return accumulatedSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
    }
  }

  return accumulatedSeconds;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}