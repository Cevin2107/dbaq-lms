"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Anhquan210706";
const ADMIN_JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-key-123456";

export async function generateToken(): Promise<string> {
  const payload = JSON.stringify({
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const hmac = crypto.createHmac("sha256", ADMIN_JWT_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return false;

    // Verify signature
    const hmac = crypto.createHmac("sha256", ADMIN_JWT_SECRET);
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest("base64url");
    if (signature !== expectedSignature) return false;

    // Verify expiration and role
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.role !== "admin" || typeof payload.exp !== "number") return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

async function ensureAdminPasswordHash() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await (supabase
    .from("admin_settings") as any)
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
  const { data: inserted, error: insertError } = await (supabase
    .from("admin_settings") as any)
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
  const { error } = await (supabase
    .from("admin_settings") as any)
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
    const token = await generateToken();
    cookieStore.set("admin_auth", token, {
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
  const token = cookieStore.get("admin_auth")?.value;
  if (!token) return false;
  return await verifyToken(token);
}
