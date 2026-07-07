import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const safeFileName = (title: string, extension: string) => {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "document";
  return `${base}.${extension}`;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";

  const supabase = createSupabaseAdmin();
  const { data: document, error } = await (supabase.from("documents") as any)
    .select("title, file_url, file_extension, mime_type")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!document?.file_url) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const extension = String(document.file_extension || "bin").replace(/^\./, "").toLowerCase();
  const contentType = document.mime_type || MIME_BY_EXTENSION[extension] || "application/octet-stream";
  const filename = safeFileName(document.title || "document", extension);
  const range = req.headers.get("range");

  const upstream = await fetch(document.file_url, {
    headers: range ? { Range: range } : undefined,
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `Could not load document file (${upstream.status})` },
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  if (disposition === "attachment") {
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");

  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) headers.set("Content-Length", contentLength);
  if (contentRange) headers.set("Content-Range", contentRange);

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers,
  });
}
