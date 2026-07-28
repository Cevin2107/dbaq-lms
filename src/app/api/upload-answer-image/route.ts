import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Only allow image files
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    let catboxUrl: string | null = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = file.name || `upload_${randomUUID()}.${fileExt}`;
      const blob = new Blob([buffer], { type: file.type || "image/jpeg" });

      const form = new FormData();
      form.append("reqtype", "fileupload");
      if (process.env.CATBOX_USERHASH) {
        form.append("userhash", process.env.CATBOX_USERHASH);
      }

      form.append("fileToUpload", blob, fileName);

      const catboxRes = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      const textResponse = await catboxRes.text();
      console.log(`[CATBOX-ANSWER-UPLOAD] Status: ${catboxRes.status} | Response: "${textResponse}"`);

      if (catboxRes.ok && textResponse.startsWith("http")) {
        catboxUrl = textResponse.trim();
      } else {
        console.error(`[CATBOX-ANSWER-UPLOAD-FAILED] Status: ${catboxRes.status} | Response: "${textResponse}"`);
      }
    } catch (e) {
      console.error("[CATBOX-ANSWER-UPLOAD-EXCEPTION]", e);
    }

    if (catboxUrl) {
      return NextResponse.json({ url: catboxUrl });
    }

    // Fallback to Supabase if enabled
    if (process.env.ENABLE_SUPABASE_IMAGE_BACKUP !== "true") {
      return NextResponse.json({ error: "Catbox upload failed and Supabase backup is disabled" }, { status: 500 });
    }

    const supabase = createSupabaseAdmin();
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("answer-images")
      .upload(fileName, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("answer-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Answer image upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
