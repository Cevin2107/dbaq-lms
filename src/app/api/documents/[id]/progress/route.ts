import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const getServerSupabase = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No cookie mutation needed for this endpoint.
        },
      },
    }
  );
};

const mapProgress = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  documentId: row.document_id,
  lastPage: Number(row.last_page || 1),
  lastScrollPosition: Number(row.last_scroll_position || 0),
  updatedAt: row.updated_at,
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ progress: null }, { status: 200 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("document_reading_progress")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data ? mapProgress(data) : null });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ban can dang nhap de luu vi tri doc" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const lastPage = Math.max(1, Number(body.lastPage || 1));
  const lastScrollPosition = Math.max(0, Number(body.lastScrollPosition || 0));

  const admin = createSupabaseAdmin();
  const { data, error } = await (admin.from("document_reading_progress") as any)
    .upsert(
      {
        user_id: user.id,
        document_id: id,
        last_page: lastPage,
        last_scroll_position: lastScrollPosition,
      },
      { onConflict: "user_id,document_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: mapProgress(data) });
}
