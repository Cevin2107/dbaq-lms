"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Anhquan210706";

async function ensureAdminPasswordHash() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("admin_password_hash")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.admin_password_hash) {
    return data.admin_password_hash;
  }

  const adminPasswordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const { data: inserted, error: insertError } = await supabase
    .from("admin_settings")
    .insert({ id: 1, admin_password_hash: adminPasswordHash })
    .select("admin_password_hash")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.admin_password_hash;
}

export async function verifyAdminPassword(password: string) {
  const hash = await ensureAdminPasswordHash();
  return bcrypt.compare(password, hash);
}

export async function updateAdminPassword(newPassword: string) {
  const supabase = createSupabaseAdmin();
  const adminPasswordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("admin_settings")
    .update({
      admin_password_hash: adminPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    throw error;
  }
}

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password") as string;

  if (await verifyAdminPassword(password)) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    redirect("/admin/dashboard");
  }

  return { error: "Mật khẩu không đúng" };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
  redirect("/admin");
}

export async function checkAdminAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "true";
}
