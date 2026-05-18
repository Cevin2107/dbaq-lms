import { supabase } from "@/features/admin/schedule/lib/supabase";
import type { Student } from "@/features/admin/schedule/lib/database.types";

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addStudent(name: string, salaryPerSession: number, color?: string): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name,
      salary_per_session: salaryPerSession,
      color: color || "#3B82F6",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStudent(
  id: string,
  updates: Partial<Omit<Student, "id" | "created_at" | "updated_at">>
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  // This will cascade delete all sessions for this student due to foreign key constraint
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) throw error;
}

export async function getStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();

  if (error) return null;
  return data;
}
