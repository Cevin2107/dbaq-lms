import { createClient } from "@supabase/supabase-js";

/**
 * Phát tín hiệu Realtime Broadcast qua Supabase để tất cả học sinh đang làm bài nhận cập nhật ngay lập tức.
 * Dùng được cả phía Server (API Route) và Client (Admin UI).
 */
export async function broadcastQuestionsUpdate(assignmentId: string) {
  if (!assignmentId) return;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      typeof window === "undefined"
        ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !key) return;

    const supabase = createClient(supabaseUrl, key);
    const channel = supabase.channel(`assignment-sync-${assignmentId}`);

    await new Promise<void>((resolve) => {
      let isResolved = false;
      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          supabase.removeChannel(channel);
          resolve();
        }
      }, 2500);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !isResolved) {
          isResolved = true;
          clearTimeout(timer);
          try {
            await channel.send({
              type: "broadcast",
              event: "questions_updated",
              payload: { assignmentId, timestamp: Date.now() },
            });
          } catch (e) {
            console.error("Broadcast send error:", e);
          } finally {
            supabase.removeChannel(channel);
            resolve();
          }
        }
      });
    });
  } catch (err) {
    console.error("Failed to broadcast questions update:", err);
  }
}
