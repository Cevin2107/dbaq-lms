import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth, updateAdminPassword, verifyAdminPassword } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing password fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 });
    }

    const isValid = await verifyAdminPassword(currentPassword);
    if (!isValid) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
    }

    await updateAdminPassword(newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    const message = error instanceof Error ? error.message : "Không thể đổi mật khẩu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
