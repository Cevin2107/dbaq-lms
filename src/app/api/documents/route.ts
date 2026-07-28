import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const CATBOX_UPLOAD_TIMEOUT_MS = 8 * 60 * 1000;

class CatboxUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatboxUploadError";
  }
}

const EXTENSION_TO_TYPE: Record<string, "pdf" | "image" | "office"> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  doc: "office",
  docx: "office",
  ppt: "office",
  pptx: "office",
  xls: "office",
  xlsx: "office",
};

const mapDocument = (row: any) => ({
  id: row.id,
  title: row.title,
  fileUrl: row.file_url,
  thumbnailUrl: row.thumbnail_url,
  fileType: row.file_type,
  fileExtension: row.file_extension,
  mimeType: row.mime_type,
  fileSizeBytes: Number(row.file_size_bytes ?? 0),
  grade: row.grade,
  subject: row.subject,
  uploaderId: row.uploader_id,
  uploaderName: row.uploader_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

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

const getExtension = (fileName: string) => {
  const raw = fileName.split(".").pop()?.trim().toLowerCase() || "";
  return raw.replace(/^\./, "");
};

async function uploadExternalDocument(file: File): Promise<string | null> {
  const arrayBuffer = await file.arrayBuffer();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const mimeType = file.type || "application/octet-stream";
  const fileName = file.name || `doc_${randomUUID()}.${fileExt}`;
  const fileToUpload = new File([arrayBuffer], fileName, { type: mimeType });

  // 1. Try Pone.rs (Primary CDN)
  try {
    console.log(`[PONE-DOC-UPLOAD] Attempting Pone.rs: ${fileName} (${fileToUpload.size} bytes)`);
    const form = new FormData();
    form.append("files[]", fileToUpload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
        const url = String(json.files[0].url).trim();
        console.log(`[PONE-DOC-UPLOAD-SUCCESS] URL: ${url}`);
        return url;
      }
    }
  } catch (e: any) {
    console.warn("[PONE-DOC-UPLOAD-FAILED]", e?.message || e, "-> Trying Catbox...");
  }

  // 2. Try Catbox (Secondary CDN)
  try {
    console.log(`[CATBOX-DOC-UPLOAD] Attempting Catbox: ${fileName} (${fileToUpload.size} bytes)`);
    const form = new FormData();
    form.append("reqtype", "fileupload");
    if (process.env.CATBOX_USERHASH) {
      form.append("userhash", process.env.CATBOX_USERHASH);
    }
    form.append("fileToUpload", fileToUpload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const catboxRes = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = (await catboxRes.text()).trim();
    if (catboxRes.ok && text.startsWith("http")) {
      console.log(`[CATBOX-DOC-UPLOAD-SUCCESS] URL: ${text}`);
      return text;
    }
  } catch (e: any) {
    console.warn("[CATBOX-DOC-UPLOAD-FAILED]", e?.message || e, "-> Switching to Supabase Storage");
  }

  return null;
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: (data || []).map(mapDocument) });
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Khong the tai danh sach tai lieu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để upload tài liệu" }, { status: 401 });
    }

    const formData = await req.formData();
    const fileUrlParam = formData.get("fileUrl") as string | null;
    const title = String(formData.get("title") || "").trim();
    const grade = String(formData.get("grade") || "").trim();
    const subject = String(formData.get("subject") || "").trim();

    if (!title || !grade || !subject) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tên tài liệu, lớp và môn học" }, { status: 400 });
    }

    let fileUrl: string;
    let extension: string;
    let fileType: "pdf" | "image" | "office";
    let mimeType: string | null = null;
    let fileSizeBytes: number = 0;

    if (fileUrlParam) {
      fileUrl = fileUrlParam;
      fileSizeBytes = Number(formData.get("fileSize") || 0);
      if (fileSizeBytes <= 0) {
        fileSizeBytes = 1;
      }
      extension = String(formData.get("fileExtension") || "").toLowerCase();
      fileType = EXTENSION_TO_TYPE[extension];
      mimeType = String(formData.get("mimeType") || "") || null;
      if (!fileType) {
        return NextResponse.json({ error: "Định dạng file không được hỗ trợ" }, { status: 400 });
      }
    } else {
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
      }

      if (file.size >= MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File phải nhỏ hơn 200 MB" }, { status: 400 });
      }

      extension = getExtension(file.name);
      fileType = EXTENSION_TO_TYPE[extension];
      if (!fileType) {
        return NextResponse.json({ error: "Định dạng file không được hỗ trợ" }, { status: 400 });
      }
      mimeType = file.type || null;
      fileSizeBytes = file.size;

      let externalUrl: string | null = null;
      try {
        externalUrl = await uploadExternalDocument(file);
      } catch (error) {
        console.error("External document upload failed, checking fallback:", error);
      }

      if (externalUrl) {
        fileUrl = externalUrl;
      } else {
        // Fallback to Supabase Storage if external CDN uploads fail
        try {
          console.log("External uploads failed. Falling back to Supabase Storage for document...");
          const admin = createSupabaseAdmin();
          const arrayBuffer = await file.arrayBuffer();
          const uniquePath = `doc-${randomUUID()}.${extension}`;

          const { error: uploadError } = await admin.storage
            .from("documents")
            .upload(uniquePath, new Uint8Array(arrayBuffer), {
              contentType: file.type || "application/octet-stream",
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = admin.storage
            .from("documents")
            .getPublicUrl(uniquePath);

          fileUrl = publicUrlData.publicUrl;
        } catch (supabaseError) {
          console.error("Supabase document fallback upload failed:", supabaseError);
          return NextResponse.json(
            {
              error: "Không thể upload tệp tài liệu (Pone.rs, Catbox và Supabase đều lỗi)",
            },
            { status: 502 }
          );
        }
      }
    }

    const uploaderName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email ||
      null;

    const thumbnailUrl = fileType === "image" ? fileUrl : null;
    const admin = createSupabaseAdmin();
    const { data, error } = await (admin.from("documents") as any)
      .insert({
        title,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        file_type: fileType,
        file_extension: extension,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        grade,
        subject,
        uploader_id: user.id,
        uploader_name: uploaderName,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: mapDocument(data) }, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload tài liệu thất bại" }, { status: 500 });
  }
}
