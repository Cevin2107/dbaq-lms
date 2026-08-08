import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    // Execute ALL database & Auth queries in a SINGLE parallel Promise.all for maximum speed
    const [
      usersRes,
      profilesRes,
      sessionsRes,
      scheduleStudentsRes,
      registrationsRes,
      assignmentsRes
    ] = await Promise.all([
      supabase.auth.admin.listUsers().catch(err => ({ data: { users: [] }, error: err })),
      supabase.from("student_profiles").select("id, full_name, created_at"),
      supabase
        .from("teaching_sessions")
        .select("*, students(id, name, color)")
        .gte("teaching_date", startDate)
        .lte("teaching_date", endDate),
      supabase.from("students").select("id, name, color, salary_per_session"),
      supabase
        .from("schedule_registrations")
        .select(`
          id,
          student_id,
          student_profiles (
            full_name
          ),
          available_schedules (
            id,
            day_of_week,
            shifts (
              id,
              name,
              start_time,
              end_time
            )
          )
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select("id, title, subject, grade, is_hidden, created_at, duration_minutes, total_score")
        .order("created_at", { ascending: false }),
    ]);

    const usersData = usersRes.data;
    const profiles = profilesRes.data || [];
    const sessionsData = sessionsRes.data || [];
    const scheduleStudents = scheduleStudentsRes.data || [];
    const registrationsData = registrationsRes.data || [];
    const assignmentsData = assignmentsRes.data || [];

    // Build unique system students map by normalized full_name / email
    const registeredStudentsMap = new Map<string, {
      id: string;
      full_name: string;
      email?: string;
      created_at: string;
    }>();

    (usersData?.users || []).forEach((u) => {
      const fullName = (u.user_metadata?.full_name as string | undefined)?.trim() || u.email || "Học sinh";
      const key = fullName.toLowerCase();
      if (!registeredStudentsMap.has(key)) {
        registeredStudentsMap.set(key, {
          id: u.id,
          full_name: fullName,
          email: u.email,
          created_at: u.created_at,
        });
      }
    });

    (profiles as any[]).forEach((p: any) => {
      if (p.full_name) {
        const fullName = p.full_name.trim();
        const key = fullName.toLowerCase();
        if (!registeredStudentsMap.has(key)) {
          registeredStudentsMap.set(key, {
            id: p.id,
            full_name: fullName,
            created_at: p.created_at || new Date().toISOString(),
          });
        }
      }
    });

    const registeredStudents = Array.from(registeredStudentsMap.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name, "vi")
    );

    // Count sessions per student name (case-insensitive matching to system students)
    const sessionsPerStudent: Record<string, { count: number; subjects: Record<string, number> }> = {};

    sessionsData.forEach((sess: any) => {
      const studentName = sess.students?.name?.trim() || "";
      if (!studentName) return;
      const key = studentName.toLowerCase();
      if (!sessionsPerStudent[key]) {
        sessionsPerStudent[key] = { count: 0, subjects: {} };
      }
      sessionsPerStudent[key].count += 1;
      const subj = sess.subject || "Khác";
      sessionsPerStudent[key].subjects[subj] = (sessionsPerStudent[key].subjects[subj] || 0) + 1;
    });

    // Group weekly registered shifts by day of week (2..8) and by student
    const weeklyShiftsByDay: Record<number, Array<{
      registrationId: string;
      studentId: string;
      studentName: string;
      shiftName: string;
      startTime: string;
      endTime: string;
    }>> = { 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };

    const studentWeeklyRegistrations: Record<string, Array<{
      dayOfWeek: number;
      shiftName: string;
      startTime: string;
      endTime: string;
    }>> = {};

    registrationsData.forEach((reg: any) => {
      const studentName = reg.student_profiles?.full_name?.trim() || "Học sinh";
      const studentId = reg.student_id;
      const dayOfWeek = reg.available_schedules?.day_of_week;
      const shift = reg.available_schedules?.shifts;

      if (dayOfWeek && shift) {
        const shiftItem = {
          registrationId: reg.id,
          studentId,
          studentName,
          shiftName: shift.name,
          startTime: shift.start_time,
          endTime: shift.end_time,
        };

        if (weeklyShiftsByDay[dayOfWeek]) {
          weeklyShiftsByDay[dayOfWeek].push(shiftItem);
        }

        const studentKey = studentName.toLowerCase();
        if (!studentWeeklyRegistrations[studentKey]) {
          studentWeeklyRegistrations[studentKey] = [];
        }
        studentWeeklyRegistrations[studentKey].push({
          dayOfWeek,
          shiftName: shift.name,
          startTime: shift.start_time,
          endTime: shift.end_time,
        });
      }
    });

    const totalAssignments = assignmentsData.length;
    const visibleAssignments = assignmentsData.filter((a: any) => !a.is_hidden).length;

    // Combine student items for dashboard UI
    const studentsOverview = registeredStudents.map((st) => {
      const key = st.full_name.toLowerCase();
      const sessionInfo = sessionsPerStudent[key] || { count: 0, subjects: {} };
      const weeklyRegs = (studentWeeklyRegistrations[key] || []).sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      return {
        id: st.id,
        fullName: st.full_name,
        email: st.email,
        createdAt: st.created_at,
        monthlySessionCount: sessionInfo.count,
        sessionSubjects: sessionInfo.subjects,
        registeredWeeklyShifts: weeklyRegs,
      };
    });

    return NextResponse.json(
      {
        summary: {
          totalSystemStudents: registeredStudents.length,
          totalMonthlySessions: sessionsData.length,
          totalWeeklyShifts: registrationsData.length,
          totalAssignments,
          visibleAssignments,
          currentMonth: month,
          currentYear: year,
        },
        students: studentsOverview,
        weeklyShiftsByDay,
        recentAssignments: assignmentsData.slice(0, 5),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3, stale-while-revalidate=15",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ error: (error as Error).message || "Lỗi tải thống kê" }, { status: 500 });
  }
}
