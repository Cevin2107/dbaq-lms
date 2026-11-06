import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();

    // 1. Determine Vietnam current month & year
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const targetYear = vnTime.getUTCFullYear();
    const targetMonth = vnTime.getUTCMonth() + 1; // 1-12

    // 2. Fetch all current schedule registrations along with student and shift details
    const { data: registrations, error: fetchErr } = await supabaseAdmin
      .from("schedule_registrations")
      .select(`
        id,
        google_calendar_event_id,
        student_profiles (
          full_name
        ),
        available_schedules (
          id,
          day_of_week,
          shifts (
            name,
            start_time,
            end_time
          )
        )
      `);

    if (fetchErr) throw fetchErr;
    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có ca học sinh nào đang được đăng ký.",
        count: 0,
        targetMonth,
        targetYear,
      });
    }

    let successCount = 0;
    let failedCount = 0;

    // 3. For each registration, delete old event if any and create new event for current month
    for (const reg of registrations as any[]) {
      const studentName = reg.student_profiles?.full_name || "Học sinh";
      const sched = reg.available_schedules;
      const shift = sched?.shifts;

      if (!sched || !shift) continue;

      // Delete old Google Calendar event if existed
      if (reg.google_calendar_event_id) {
        try {
          await deleteCalendarEvent(reg.google_calendar_event_id);
        } catch (calErr) {
          console.warn(`Could not delete previous calendar event ${reg.google_calendar_event_id}:`, calErr);
        }
      }

      // Create new event for targetMonth / targetYear
      try {
        const newEventId = await createCalendarEvent(
          studentName,
          sched.day_of_week,
          shift.name,
          shift.start_time,
          shift.end_time,
          { year: targetYear, month: targetMonth }
        );

        if (newEventId) {
          // Update registration with new event ID
          await (supabaseAdmin.from("schedule_registrations") as any)
            .update({ google_calendar_event_id: newEventId })
            .eq("id", reg.id);
          successCount++;
        } else {
          failedCount++;
        }
      } catch (createErr) {
        console.error(`Failed to create calendar event for reg ${reg.id}:`, createErr);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      failed: failedCount,
      targetMonth,
      targetYear,
      message: `Đã áp dụng thành công ${successCount} ca học sang Google Calendar cho Tháng ${targetMonth}/${targetYear}!`,
    });
  } catch (error: any) {
    console.error("Error applying schedule to current month calendar:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi khi áp dụng lịch sang Google Calendar." },
      { status: 500 }
    );
  }
}

