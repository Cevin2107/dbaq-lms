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
      .from("shifts")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, start_time, end_time } = body;

    if (!name?.trim() || !start_time || !end_time) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ tên ca, giờ bắt đầu và kết thúc." }, { status: 400 });
    }

    if (start_time >= end_time) {
      return NextResponse.json({ error: "Giờ bắt đầu phải trước giờ kết thúc." }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await (supabaseAdmin.from("shifts") as any)
      .insert([{ name: name.trim(), start_time, end_time }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => null);
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID ca học cần xoá." }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    // 1. Find all available schedules for this shift
    const { data: availScheds, error: fetchSchedErr } = await supabaseAdmin
      .from("available_schedules")
      .select("id")
      .eq("shift_id", id);

    if (!fetchSchedErr && availScheds && availScheds.length > 0) {
      const availSchedIds = (availScheds as any[]).map(s => s.id);
      
      // 2. Find all registrations that will be cascade-deleted
      const { data: regsToDelete, error: fetchRegsErr } = await supabaseAdmin
        .from("schedule_registrations")
        .select("id, google_calendar_event_id")
        .in("available_schedule_id", availSchedIds);

      if (!fetchRegsErr && regsToDelete && regsToDelete.length > 0) {
        for (const reg of regsToDelete as any[]) {
          if (reg.google_calendar_event_id) {
            try {
              await deleteCalendarEvent(reg.google_calendar_event_id);
            } catch (calErr) {
              console.error(`Failed to delete calendar event for registration ${reg.id} on shift delete:`, calErr);
            }
          }
        }
      }
    }

    // 3. Delete shift
    const { error } = await supabaseAdmin
      .from("shifts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}
