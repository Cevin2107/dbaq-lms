import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, max_shifts")
      .order("full_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching student limits:", error);
    return NextResponse.json({ error: "Failed to fetch student limits" }, { status: 500 });
  }
}

async function handleUpdateStudentLimit(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = body.id || body.student_id;
    const max_shifts = typeof body.max_shifts === "number" ? body.max_shifts : parseInt(body.max_shifts, 10);

    if (!id || isNaN(max_shifts) || max_shifts < 0) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ (cần id học sinh và số ca >= 0)" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await (supabaseAdmin.from("student_profiles") as any)
      .update({ max_shifts })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, id, max_shifts });
  } catch (error) {
    console.error("Error updating student limit:", error);
    return NextResponse.json({ error: "Failed to update student limit" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdateStudentLimit(req);
}

export async function POST(req: NextRequest) {
  return handleUpdateStudentLimit(req);
}

