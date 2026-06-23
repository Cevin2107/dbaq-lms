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

    let catboxUrl: string | null = null;
    
    try {
      const form = new FormData();
      form.append("reqtype", "fileupload");
      if (process.env.CATBOX_USERHASH) {
        form.append("userhash", process.env.CATBOX_USERHASH);
      }
      
      form.append("fileToUpload", file);

      const catboxRes = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
      });

      if (catboxRes.ok) {
        const textResponse = await catboxRes.text();
        if (textResponse.startsWith("http")) {
          catboxUrl = textResponse.trim();
        } else {
          console.error("Catbox upload failed with response:", textResponse);
        }
      } else {
        console.error("Catbox upload failed with status:", catboxRes.status);
      }
    } catch (e) {
      console.error("Catbox API exception:", e);
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
    const fileExt = file.name.split(".").pop();
    const fileName = `${randomUUID()}.${fileExt || "bin"}`;

    const { error } = await supabase.storage
      .from("question-images")
      .upload(fileName, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("question-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
