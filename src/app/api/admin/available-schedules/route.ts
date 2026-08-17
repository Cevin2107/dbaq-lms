import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteCalendarEvent } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("available_schedules")
      .select("*");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching available schedules:", error);
    return NextResponse.json({ error: "Failed to fetch available schedules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.schedules)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const { schedules } = body as { schedules: { day_of_week: number; shift_id: string }[] };

    // Deduplicate and validate payload items
    const uniqueSchedulesMap = new Map<string, { day_of_week: number; shift_id: string }>();
    for (const item of schedules) {
      if (item && item.day_of_week && item.shift_id) {
        uniqueSchedulesMap.set(`${item.day_of_week}-${item.shift_id}`, {
          day_of_week: Number(item.day_of_week),
          shift_id: String(item.shift_id),
        });
      }
    }
    const cleanSchedules = Array.from(uniqueSchedulesMap.values());

    // Get existing schedules
    const supabaseAdmin = createSupabaseAdmin();
    const { data: existingSchedulesData, error: getErr } = await supabaseAdmin
      .from("available_schedules")
      .select("*");
      
    if (getErr) throw getErr;
    const existingSchedules = (existingSchedulesData || []) as any[];

    const existingMap = new Set(existingSchedules.map(s => `${s.day_of_week}-${s.shift_id}`));
    const newMap = new Set(cleanSchedules.map(s => `${s.day_of_week}-${s.shift_id}`));

    const toInsert = cleanSchedules.filter(s => !existingMap.has(`${s.day_of_week}-${s.shift_id}`));
    const toDeleteIds = existingSchedules.filter(s => !newMap.has(`${s.day_of_week}-${s.shift_id}`)).map(s => s.id);

    // Perform deletions
    if (toDeleteIds.length > 0) {
      // Find all schedule_registrations that will be cascade-deleted
      const { data: regsToDelete, error: fetchErr } = await supabaseAdmin
        .from("schedule_registrations")
        .select("id, google_calendar_event_id")
        .in("available_schedule_id", toDeleteIds);

      if (!fetchErr && regsToDelete && regsToDelete.length > 0) {
        for (const reg of regsToDelete as any[]) {
          if (reg.google_calendar_event_id) {
            try {
              await deleteCalendarEvent(reg.google_calendar_event_id);
            } catch (calErr) {
              console.error(`Failed to delete calendar event for registration ${reg.id} on available schedule delete:`, calErr);
            }
          }
        }
      }

      const { error: delErr } = await supabaseAdmin
        .from("available_schedules")
        .delete()
        .in("id", toDeleteIds);
      if (delErr) throw delErr;
    }

    // Perform insertions
    if (toInsert.length > 0) {
      const recordsToInsert = toInsert.map(s => ({
        day_of_week: s.day_of_week,
        shift_id: s.shift_id,
      }));

      const { error: insErr } = await (supabaseAdmin.from("available_schedules") as any).insert(recordsToInsert);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving available schedules:", error);
    return NextResponse.json({ error: "Failed to save available schedules" }, { status: 500 });
  }
}
