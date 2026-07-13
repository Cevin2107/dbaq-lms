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

async function uploadToCatbox(file: File, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const form = new FormData();
      form.append("reqtype", "fileupload");
      if (process.env.CATBOX_USERHASH) {
        form.append("userhash", process.env.CATBOX_USERHASH);
      }
      form.append("fileToUpload", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CATBOX_UPLOAD_TIMEOUT_MS);
      const res = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
        headers: {
          "User-Agent": "DBAQ-LMS/1.0",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const text = (await res.text()).trim();
      if (res.ok && text.startsWith("http")) {
        return text;
      }

      if (attempt === attempts) {
        throw new CatboxUploadError(text || `Catbox rejected the upload with status ${res.status}`);
      }
    } catch (error) {
      if (attempt === attempts) {
        if (error instanceof CatboxUploadError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new CatboxUploadError("Catbox upload timed out");
        }

        throw new CatboxUploadError(error instanceof Error ? error.message : "Catbox upload failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }

  throw new CatboxUploadError("Catbox upload failed");
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

      let catboxUrl: string | null = null;
      try {
        catboxUrl = await uploadToCatbox(file);
      } catch (error) {
        console.error("Catbox document upload failed, checking fallback:", error);
      }

      if (catboxUrl) {
        fileUrl = catboxUrl;
      } else {
        // Fallback to Supabase Storage if backup is enabled
        if (process.env.ENABLE_SUPABASE_IMAGE_BACKUP === "true") {
          try {
            console.log("Catbox failed. Falling back to Supabase upload for document...");
            const admin = createSupabaseAdmin();
            const arrayBuffer = await file.arrayBuffer();
            const uniquePath = `doc-${randomUUID()}.${extension}`;
            
            const { error: uploadError } = await admin.storage
              .from("documents")
              .upload(uniquePath, Buffer.from(arrayBuffer), {
                contentType: file.type || "application/octet-stream",
                upsert: false,
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
                error: "Cả Catbox và Supabase upload đều thất bại",
              },
              { status: 502 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: "Catbox upload thất bại và Supabase backup bị tắt",
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
