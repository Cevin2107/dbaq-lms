import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: "Lỗi lấy danh sách học sinh" }, { status: 500 });
  }

  const students = (data?.users || []).map((user) => ({
    id: user.id,
    full_name: (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || "Không xác định",
    email: user.email || "",
    created_at: user.created_at,
  })).sort((a, b) => a.full_name.localeCompare(b.full_name, "vi"));

  return NextResponse.json({ students });
}

export async function PATCH(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: {
    id?: string;
    fullName?: string;
    email?: string;
    password?: string;
    currentName?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const id = payload.id?.trim();
  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim();
  const password = payload.password?.trim();
  const currentName = payload.currentName?.trim();

  if (!id) {
    return NextResponse.json({ error: "Thiếu id học sinh" }, { status: 400 });
  }

  if (!fullName && !email && !password) {
    return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const updateBody: {
    email?: string;
    password?: string;
    user_metadata?: { full_name?: string };
  } = {};

  if (email) updateBody.email = email;
  if (password) updateBody.password = password;
  if (fullName) updateBody.user_metadata = { full_name: fullName };

  const { data: updated, error } = await supabase.auth.admin.updateUserById(id, updateBody);
  if (error) {
    return NextResponse.json({ error: error.message || "Lỗi cập nhật học sinh" }, { status: 400 });
  }

  if (fullName && currentName && fullName !== currentName) {
    const [{ error: submissionsError }, { error: sessionsError }, { error: profilesError }] = await Promise.all([
      supabase
        .from("submissions")
        .update({ student_name: fullName })
        .eq("student_name", currentName),
      supabase
        .from("student_sessions")
        .update({ student_name: fullName })
        .eq("student_name", currentName),
      supabase
        .from("student_profiles")
        .update({ full_name: fullName })
        .eq("full_name", currentName),
    ]);

    if (submissionsError || sessionsError || profilesError) {
      return NextResponse.json(
        { error: "Cập nhật tên học sinh trong dữ liệu bài làm thất bại" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updated.user?.id,
      email: updated.user?.email,
      full_name: (updated.user?.user_metadata?.full_name as string | undefined) || "",
    },
  });
}
