import { supabase } from "@/features/admin/schedule/lib/supabase";
import type { Subject } from "@/features/admin/schedule/lib/database.types";

export async function getSessionsByMonth(year: number, month: number, studentId?: string) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  let query = supabase
    .from("teaching_sessions")
    .select("*")
    .gte("teaching_date", startDate)
    .lte("teaching_date", endDate)
    .order("teaching_date", { ascending: true });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function addSession(date: string, subject: Subject, studentId: string) {
  const { data, error } = await supabase
    .from("teaching_sessions")
    .insert({ teaching_date: date, subject, student_id: studentId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSessionsByDate(date: string, studentId?: string) {
  let query = supabase.from("teaching_sessions").delete().eq("teaching_date", date);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function getSessionsForAllStudents(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const { data, error } = await supabase
    .from("teaching_sessions")
    .select("*, students(*)")
    .gte("teaching_date", startDate)
    .lte("teaching_date", endDate)
    .order("teaching_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSessionsForYear(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("teaching_sessions")
    .select("teaching_date")
    .gte("teaching_date", startDate)
    .lte("teaching_date", endDate);

  if (error) throw error;
  return data || [];
}
