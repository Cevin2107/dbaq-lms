import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

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
          // API routes in this app do not need to mutate auth cookies here.
        },
      },
    }
  );
};

export async function POST(req: Request) {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để upload tài liệu" }, { status: 401 });
    }

    const { fileName, fileType } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    let bucketName = "documents";

    // Ensure documents bucket exists and is public
    try {
      const { data: buckets, error: listError } = await admin.storage.listBuckets();
      if (listError) {
        console.error("Supabase listBuckets error:", listError);
      }

      const exists = buckets?.some((b) => b.name === "documents");
      if (!exists) {
        console.log("Documents bucket does not exist. Attempting to create it...");
        const { error: createError } = await admin.storage.createBucket("documents", {
          public: true,
          fileSizeLimit: 209715200, // 200MB
        });
        if (createError) {
          console.error("Failed to create 'documents' bucket, falling back to 'question-images':", createError);
          bucketName = "question-images";
        }
      }
    } catch (bucketError) {
      console.error("Error verifying/creating bucket documents, falling back to 'question-images':", bucketError);
      bucketName = "question-images";
    }

    const ext = fileName.split(".").pop()?.trim().toLowerCase() || "bin";
    const uniquePath = `doc-${randomUUID()}.${ext}`;

    const { data, error } = await admin.storage
      .from(bucketName)
      .createSignedUploadUrl(uniquePath);

    if (error || !data) {
      console.error(`Failed to create signed URL on bucket ${bucketName}:`, error);
      return NextResponse.json({ error: error?.message || "Failed to create signed URL" }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from(bucketName)
      .getPublicUrl(uniquePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: uniquePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Error creating signed upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
