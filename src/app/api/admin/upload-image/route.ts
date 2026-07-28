import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";


// Use Node.js runtime to access Buffer/crypto
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let uploadedUrl: string | null = null;
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const mimeType = file.type && file.type.startsWith("image/") ? file.type : `image/${fileExt === "png" ? "png" : "jpeg"}`;
    const fileName = file.name || `upload_${randomUUID()}.${fileExt}`;

    // 1. Attempt Pone.rs upload (Primary - Fast CDN)
    try {
      const fileToUpload = new File([arrayBuffer], fileName, { type: mimeType });
      console.log(`[PONE-ADMIN-UPLOAD] Uploading to Pone.rs: ${fileName} (${fileToUpload.size} bytes)`);

      const form = new FormData();
      form.append("files[]", fileToUpload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const poneRes = await fetch("https://pone.rs/upload", {
        method: "POST",
        body: form,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (poneRes.ok) {
        const json = await poneRes.json().catch(() => ({}));
        if (json?.success && Array.isArray(json?.files) && json.files[0]?.url) {
          uploadedUrl = String(json.files[0].url).trim();
          console.log(`[PONE-ADMIN-UPLOAD-SUCCESS] URL: ${uploadedUrl}`);
        }
      }
    } catch (e: any) {
      console.warn("[PONE-ADMIN-UPLOAD-FAILED]", e?.message || e, "-> Switching to Catbox...");
    }

    if (uploadedUrl) {
      return NextResponse.json({ url: uploadedUrl });
    }

    // 2. Attempt Catbox upload (Secondary)
    try {
      const fileToUpload = new File([arrayBuffer], fileName, { type: mimeType });
      console.log(`[CATBOX-ADMIN-UPLOAD] Uploading to Catbox: ${fileName} (${fileToUpload.size} bytes)`);

      const form = new FormData();
      form.append("reqtype", "fileupload");
      if (process.env.CATBOX_USERHASH) {
        form.append("userhash", process.env.CATBOX_USERHASH);
      }
      form.append("fileToUpload", fileToUpload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const catboxRes = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const textResponse = await catboxRes.text();
      console.log(`[CATBOX-ADMIN-UPLOAD] Status: ${catboxRes.status} | Response: "${textResponse}"`);

      if (catboxRes.ok && textResponse.trim().startsWith("http")) {
        uploadedUrl = textResponse.trim();
      }
    } catch (e: any) {
      console.warn("[CATBOX-ADMIN-UPLOAD-FAILED]", e?.message || e, "-> Switching to Supabase Storage");
    }

    if (uploadedUrl) {
      return NextResponse.json({ url: uploadedUrl });
    }

    // 3. Fallback to Supabase Storage if external services fail
    console.log("[SUPABASE-STORAGE-FALLBACK] Uploading image to Supabase Storage...");
    const supabase = createSupabaseAdmin();
    const storageFileName = `${randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("question-images")
      .upload(storageFileName, new Uint8Array(arrayBuffer), {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("[SUPABASE-STORAGE-ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("question-images")
      .getPublicUrl(storageFileName);

    console.log("[STORAGE-FALLBACK-SUCCESS] Supabase URL:", publicUrlData.publicUrl);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
