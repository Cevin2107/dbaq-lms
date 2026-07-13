"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LmsDocument } from "@/lib/types";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker using local bundled worker for Next.js/Webpack 5
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();


const ACCEPTED_EXTENSIONS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const READING_PROGRESS_PREFIX = "dbaq-lms:document-progress:";
const DOCUMENT_CACHE_NAME = "dbaq-lms-document-cache-v1";
const ALL = "Tất cả";

const DOCUMENT_OPTIONS = {
  disableRange: true,
  disableStream: true,
};

type UploadState = {
  file: File | null;
  title: string;
  grade: string;
  subject: string;
};

const initialUploadState: UploadState = {
  file: null,
  title: "",
  grade: "",
  subject: "",
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getExtension = (fileName: string) => fileName.split(".").pop()?.trim().toLowerCase() || "";

const subjectColor = (subject: string) => {
  const map: Array<[string, string]> = [
    ["Toán", "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"],
    ["Lý", "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"],
    ["Hóa", "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"],
    ["Văn", "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"],
    ["Anh", "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"],
    ["Sinh", "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"],
  ];
  return map.find(([key]) => subject.includes(key))?.[1] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
};

const getProgressKey = (documentId: string) => `${READING_PROGRESS_PREFIX}${documentId}`;

const readLocalProgress = (documentId: string) => {
  try {
    const raw = window.localStorage.getItem(getProgressKey(documentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      lastPage?: number;
      lastScrollPosition?: number;
      zoom?: number;
    };
    return {
      lastPage: Math.max(1, Number(parsed.lastPage || 1)),
      lastScrollPosition: Math.max(0, Number(parsed.lastScrollPosition || 0)),
      zoom: Math.min(200, Math.max(50, Number(parsed.zoom || 100))),
    };
  } catch {
    return null;
  }
};

const writeLocalProgress = (
  documentId: string,
  progress: { lastPage: number; lastScrollPosition: number; zoom: number }
) => {
  try {
    window.localStorage.setItem(
      getProgressKey(documentId),
      JSON.stringify({
        ...progress,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Reading progress is helpful, not critical.
  }
};

const getDocumentCacheUrl = (documentId: string) => `/api/documents/${documentId}/file`;

const createCachedDocumentObjectUrl = async (documentId: string) => {
  if (!("caches" in window)) return null;
  const cache = await window.caches.open(DOCUMENT_CACHE_NAME);
  const response = await cache.match(getDocumentCacheUrl(documentId));
  if (!response) return null;
  const blob = await response.blob();
  if (!blob.size) return null;
  return URL.createObjectURL(blob);
};



function DocumentThumbnail({ document }: { document: LmsDocument }) {
  if (document.fileType === "image" && document.thumbnailUrl) {
    return (
      <img
        src={document.thumbnailUrl}
        alt={document.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  if (document.fileType === "pdf") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-sky-50 dark:from-red-500/10 dark:via-[#1d1d1f] dark:to-sky-500/10">
        <FileText className="h-12 w-12 text-red-500" />
        <span className="mt-3 rounded-full bg-white/80 dark:bg-black/30 px-3 py-1 text-[12px] font-semibold text-red-600 dark:text-red-300">
          PDF
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-[#1d1d1f] dark:to-blue-500/10">
      <FileArchive className="h-12 w-12 text-[#0066cc]" />
      <span className="mt-3 rounded-full bg-white/80 dark:bg-black/30 px-3 py-1 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
        {document.fileExtension.toUpperCase()}
      </span>
    </div>
  );
}

export function DocumentsPanel() {
  const [documents, setDocuments] = useState<LmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upload, setUpload] = useState<UploadState>(initialUploadState);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [embedUrl, setEmbedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewerDocument, setViewerDocument] = useState<LmsDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfSourceBaseUrl, setPdfSourceBaseUrl] = useState("");
  const [pdfCacheStatus, setPdfCacheStatus] = useState("");
  const [lastProgressSavedAt, setLastProgressSavedAt] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfCacheProgress, setPdfCacheProgress] = useState<number | null>(null);
  const viewerScrollRef = useRef<HTMLDivElement | null>(null);
  const uploadWaitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pdfObjectUrlRef = useRef<string | null>(null);
  const pdfAbortControllerRef = useRef<AbortController | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  const cleanupOrphanedProgress = (activeDocuments: LmsDocument[]) => {
    try {
      const activeIds = new Set(activeDocuments.map((d) => d.id));
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(READING_PROGRESS_PREFIX)) {
          const docId = key.substring(READING_PROGRESS_PREFIX.length);
          if (!activeIds.has(docId)) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (e) {
      console.error("Error cleaning up orphaned progress:", e);
    }
  };

  const cleanupOrphanedCache = async (activeDocuments: LmsDocument[]) => {
    try {
      if (!("caches" in window)) return;
      const cache = await window.caches.open(DOCUMENT_CACHE_NAME);
      const keys = await cache.keys();
      const activeIds = new Set(activeDocuments.map((d) => d.id));
      for (const request of keys) {
        const url = new URL(request.url);
        const match = url.pathname.match(/\/api\/documents\/([^\/]+)\/file/);
        if (match && match[1]) {
          const docId = match[1];
          if (!activeIds.has(docId)) {
            await cache.delete(request);
          }
        }
      }
    } catch (e) {
      console.error("Error cleaning up orphaned cache:", e);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải tài liệu");
      const fetchedDocs = data.documents || [];
      setDocuments(fetchedDocs);
      cleanupOrphanedProgress(fetchedDocs);
      cleanupOrphanedCache(fetchedDocs);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể tải tài liệu" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    return () => {
      clearUploadWaitTimer();
      clearPdfObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setContainerWidth(pdfContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    resizeObserver.observe(pdfContainerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [viewerDocument]);

  useEffect(() => {
    setSubjectFilter(ALL);
  }, [gradeFilter]);

  const grades = useMemo(() => {
    return Array.from(new Set(documents.map((item) => item.grade))).sort((a, b) => b.localeCompare(a, "vi"));
  }, [documents]);

  const subjects = useMemo(() => {
    const source = gradeFilter === ALL ? documents : documents.filter((item) => item.grade === gradeFilter);
    return Array.from(new Set(source.map((item) => item.subject))).sort((a, b) => a.localeCompare(b, "vi"));
  }, [documents, gradeFilter]);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return documents.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.subject.toLowerCase().includes(keyword) ||
        item.grade.toLowerCase().includes(keyword);
      const matchesGrade = gradeFilter === ALL || item.grade === gradeFilter;
      const matchesSubject = subjectFilter === ALL || item.subject === subjectFilter;
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [documents, gradeFilter, search, subjectFilter]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const extension = getExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setMessage({ type: "error", text: "Định dạng file không được hỗ trợ." });
      event.target.value = "";
      return;
    }

    if (file.size >= MAX_FILE_SIZE) {
      setMessage({ type: "error", text: "File phải nhỏ hơn 200 MB." });
      event.target.value = "";
      return;
    }

    setUpload((current) => ({
      ...current,
      file,
      title: current.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
  };

  const resetUpload = () => {
    setUpload(initialUploadState);
    setUploadProgress(0);
    setUploadStatus("");
    setUploadType("file");
    setEmbedUrl("");
  };

  const clearUploadWaitTimer = () => {
    if (uploadWaitTimerRef.current) {
      clearInterval(uploadWaitTimerRef.current);
      uploadWaitTimerRef.current = null;
    }
  };

  const clearPdfObjectUrl = () => {
    if (pdfObjectUrlRef.current) {
      const urlToRevoke = pdfObjectUrlRef.current;
      pdfObjectUrlRef.current = null;
      // Revoke after a short delay so the Web Worker can clean up cleanly
      setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
      }, 2000);
    }
  };

  const cacheDocumentWithProgress = async (documentId: string, fileUrl: string, signal?: AbortSignal) => {
    const cacheUrl = getDocumentCacheUrl(documentId);
    
    if (!("caches" in window)) {
      return cacheUrl;
    }
    
    const cache = await window.caches.open(DOCUMENT_CACHE_NAME);
    const cachedResponse = await cache.match(cacheUrl);
    
    if (cachedResponse) {
      setPdfCacheStatus("Đang đọc tài liệu từ bộ nhớ đệm...");
      setPdfCacheProgress(100);
      const blob = await cachedResponse.blob();
      if (blob.size > 0) {
        const objUrl = URL.createObjectURL(blob);
        pdfObjectUrlRef.current = objUrl;
        return objUrl;
      }
    }
    
    setPdfCacheStatus("Đang tải tệp về trình duyệt...");
    setPdfCacheProgress(0);
    
    // Always use local proxy to bypass ISP blocks on Catbox and get instant progress feedback
    const response = await fetch(cacheUrl, { cache: "reload", signal });
    
    if (!response.ok) {
      throw new Error(`Tải tệp thất bại (${response.status})`);
    }
    
    const contentLengthHeader = response.headers.get("content-length");
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    
    const reader = response.body?.getReader();
    if (!reader) {
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      pdfObjectUrlRef.current = objUrl;
      return objUrl;
    }
    
    let loadedBytes = 0;
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loadedBytes += value.length;
        if (totalBytes > 0) {
          const progress = Math.round((loadedBytes / totalBytes) * 100);
          setPdfCacheProgress(progress);
        }
      }
    }
    
    // Concatenate all chunks into a single contiguous Uint8Array to prevent browser-specific Blob corruption bugs
    const fileData = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fileData.set(chunk, offset);
      offset += chunk.length;
    }
    
    const blob = new Blob([fileData], { type: "application/pdf" });
    
    try {
      const cacheResponse = new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(blob.size),
        },
      });
      await cache.put(cacheUrl, cacheResponse);
    } catch (e) {
      console.error("Lưu cache thất bại:", e);
    }
    
    const objUrl = URL.createObjectURL(blob);
    pdfObjectUrlRef.current = objUrl;
    return objUrl;
  };

  const saveLocalReadingProgress = (document = viewerDocument) => {
    if (!document || document.fileType !== "pdf") return;
    writeLocalProgress(document.id, {
      lastPage: pdfPage,
      lastScrollPosition: viewerScrollRef.current?.scrollTop || 0,
      zoom: pdfZoom,
    });
    setLastProgressSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
  };

  useEffect(() => {
    if (!viewerDocument || viewerDocument.fileType !== "pdf") return;
    const timeoutId = window.setTimeout(() => saveLocalReadingProgress(viewerDocument), 400);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerDocument?.id, pdfPage, pdfZoom]);

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (uploadType === "file" && !upload.file) {
      setMessage({ type: "error", text: "Vui lòng chọn file." });
      return;
    }
    if (uploadType === "url" && !embedUrl.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập đường dẫn liên kết." });
      return;
    }
    if (!upload.title.trim() || !upload.grade.trim() || !upload.subject.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ tên tài liệu, lớp và môn học." });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("Đang chuẩn bị upload...");
    setMessage(null);
    clearUploadWaitTimer();

    try {
      if (uploadType === "url") {
        setUploadStatus("Đang liên kết tài liệu...");
        const ext = embedUrl.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase() || "bin";
        const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
        
        const formData = new FormData();
        formData.append("fileUrl", embedUrl.trim());
        formData.append("fileSize", "0");
        formData.append("fileExtension", ext);
        formData.append("mimeType", mime);
        formData.append("title", upload.title.trim());
        formData.append("grade", upload.grade.trim());
        formData.append("subject", upload.subject.trim());

        const saveRes = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        const data = await saveRes.json();
        if (saveRes.ok) {
          setUploadProgress(100);
          setUploadStatus("Hoàn tất.");
          setDocuments((current) => [data.document, ...current]);
          setMessage({ type: "success", text: "Liên kết tài liệu thành công." });
          setUploadOpen(false);
          resetUpload();
        } else {
          throw new Error(data.error || "Lưu tài liệu thất bại.");
        }
        return;
      }

      const isLargeFile = upload.file!.size > 4 * 1024 * 1024; // 4 MB limit for Vercel Serverless Function body limit

      if (isLargeFile) {
        // Luồng 1: Cho file lớn (> 4MB) - Upload trực tiếp lên Supabase Storage qua signed URL để tránh giới hạn Vercel 4.5MB
        setUploadStatus("File lớn, đang chuẩn bị upload trực tiếp lên Supabase...");
        
        // Step 1: Lấy signed URL từ server
        const signedUrlRes = await fetch("/api/documents/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: upload.file!.name,
            fileType: upload.file!.type,
          }),
        });

        if (!signedUrlRes.ok) {
          const errorData = await signedUrlRes.json();
          throw new Error(errorData.error || "Không thể lấy link upload từ server.");
        }

        const { signedUrl, publicUrl } = await signedUrlRes.json();

        setUploadStatus("Đang tải file trực tiếp lên Supabase Storage...");
        
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", upload.file!.type || "application/octet-stream");
        xhr.timeout = 15 * 60 * 1000; // 15 phút cho file lớn

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.min(90, Math.round((event.loaded / event.total) * 90)));
          }
        };

        xhr.upload.onload = () => {
          setUploadProgress(92);
          setUploadStatus("Đang đồng bộ dữ liệu...");
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(95);
            try {
              const formData = new FormData();
              formData.append("fileUrl", publicUrl);
              formData.append("fileSize", String(upload.file!.size));
              formData.append("fileExtension", getExtension(upload.file!.name));
              formData.append("mimeType", upload.file!.type);
              formData.append("title", upload.title.trim());
              formData.append("grade", upload.grade.trim());
              formData.append("subject", upload.subject.trim());

              const saveRes = await fetch("/api/documents", {
                method: "POST",
                body: formData,
              });

              const data = await saveRes.json();
              if (saveRes.ok) {
                setUploadProgress(100);
                setUploadStatus("Hoàn tất.");
                setDocuments((current) => [data.document, ...current]);
                setMessage({ type: "success", text: "Upload tài liệu thành công." });
                setUploadOpen(false);
                resetUpload();
              } else {
                throw new Error(data.error || "Lưu metadata thất bại.");
              }
            } catch (saveErr) {
              setMessage({
                type: "error",
                text: saveErr instanceof Error ? saveErr.message : "Đồng bộ dữ liệu thất bại.",
              });
            } finally {
              setUploading(false);
            }
          } else {
            setUploading(false);
            setMessage({ type: "error", text: "Tải file lên storage thất bại." });
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          setMessage({ type: "error", text: "Lỗi kết nối khi tải file lên storage." });
        };

        xhr.ontimeout = () => {
          setUploading(false);
          setMessage({ type: "error", text: "Tải file lên storage quá hạn thời gian." });
        };

        xhr.send(upload.file!);
      } else {
        // Luồng 2: Cho file nhỏ (<= 4MB) - Upload qua API của chúng ta (sẽ ưu tiên Catbox, fallback Supabase)
        setUploadStatus("Đang tải file lên máy chủ (ưu tiên lưu Catbox)...");
        
        const formData = new FormData();
        formData.append("file", upload.file!);
        formData.append("title", upload.title.trim());
        formData.append("grade", upload.grade.trim());
        formData.append("subject", upload.subject.trim());

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/documents");
        xhr.timeout = 15 * 60 * 1000;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.min(90, Math.round((event.loaded / event.total) * 90)));
          }
        };

        xhr.upload.onload = () => {
          setUploadProgress(92);
          setUploadStatus("Đang lưu trữ và đồng bộ dữ liệu...");
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.document) {
                setUploadProgress(100);
                setUploadStatus("Hoàn tất.");
                setDocuments((current) => [data.document, ...current]);
                setMessage({ type: "success", text: "Upload tài liệu thành công." });
                setUploadOpen(false);
                resetUpload();
              } else {
                throw new Error(data.error || "Lưu metadata thất bại.");
              }
            } catch (saveErr) {
              setMessage({
                type: "error",
                text: saveErr instanceof Error ? saveErr.message : "Đồng bộ dữ liệu thất bại.",
              });
            } finally {
              setUploading(false);
            }
          } else {
            setUploading(false);
            let errorText = "Tải tài liệu thất bại.";
            try {
              const data = JSON.parse(xhr.responseText);
              errorText = data.error || errorText;
            } catch (_) {}
            setMessage({ type: "error", text: errorText });
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          setMessage({ type: "error", text: "Lỗi kết nối khi tải file." });
        };

        xhr.ontimeout = () => {
          setUploading(false);
          setMessage({ type: "error", text: "Tải file quá hạn thời gian." });
        };

        xhr.send(formData);
      }
    } catch (err) {
      setUploading(false);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Khởi tạo upload thất bại." });
    }
  };

  const openDocument = async (document: LmsDocument) => {
    if (document.fileType === "office") {
      window.open(`/api/documents/${document.id}/file?download=1`, "_blank", "noopener,noreferrer");
      return;
    }

    // If reopening the same PDF document and it's already loaded, just open it instantly!
    if (document.id === viewerDocument?.id && document.fileType === "pdf" && pdfSourceBaseUrl) {
      setIsViewerOpen(true);
      return;
    }

    // Otherwise, load it fresh
    setIsViewerOpen(true);
    clearPdfObjectUrl();
    setViewerDocument(document);
    setImageZoom(1);
    setPdfZoom(100);
    setPdfPage(1);
    setNumPages(null);
    setPdfSourceBaseUrl("");
    setPdfCacheStatus("");
    setPdfCacheProgress(null);
    setLastProgressSavedAt(null);

    if (pdfAbortControllerRef.current) {
      pdfAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    pdfAbortControllerRef.current = controller;

    if (document.fileType === "pdf") {
      const progress = readLocalProgress(document.id);
      const nextPage = progress?.lastPage || 1;
      const nextZoom = progress?.zoom || 100;
      if (progress) {
        setPdfPage(nextPage);
        setPdfZoom(nextZoom);
        requestAnimationFrame(() => {
          if (viewerScrollRef.current) {
            viewerScrollRef.current.scrollTop = progress.lastScrollPosition;
          }
        });
      }

      try {
        const cachedUrl = await cacheDocumentWithProgress(document.id, document.fileUrl, controller.signal);
        setPdfSourceBaseUrl(cachedUrl);
        setPdfCacheStatus("");
        setPdfCacheProgress(null);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Lỗi cache tài liệu:", error);
        setPdfSourceBaseUrl(getDocumentCacheUrl(document.id));
        setPdfCacheStatus("");
        setPdfCacheProgress(null);
      }
    }
  };

  const closeViewer = () => {
    if (pdfAbortControllerRef.current) {
      pdfAbortControllerRef.current.abort();
      pdfAbortControllerRef.current = null;
    }
    saveLocalReadingProgress();
    setIsViewerOpen(false);
  };

  const pdfUrl = viewerDocument?.fileType === "pdf" && pdfSourceBaseUrl
    ? `${pdfSourceBaseUrl}#page=${pdfPage}&zoom=${pdfZoom}`
    : "";

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] dark:from-[#1a1c23] dark:via-[#151921] dark:to-[#0f172a] p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,102,204,0.08)] border border-[#bae6fd]/30 dark:border-white/10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-4 tracking-[-0.02em] leading-tight mb-3">
            <span className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl text-[#0066cc] dark:text-blue-400">
              <BookOpen className="h-7 w-7" />
            </span>
            Tài liệu
          </h2>
          <p className="text-[17px] text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Kho lưu trữ tài liệu các môn học của gia sư Đào Bá Anh Quân. Upload và đọc tài liệu theo lớp, môn học.
          </p>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0066cc] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] active:scale-95 transition-all"
        >
          <Upload className="h-5 w-5" />
          Upload tài liệu
        </button>
      </div>

      {message && (
        <div
          className={clsx(
            "flex items-center justify-between gap-3 rounded-[1.5rem] border p-4 text-[15px] font-medium shadow-sm",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20"
          )}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-full bg-slate-50 dark:bg-[#2a2a2c] py-3.5 pl-12 pr-4 text-[16px] text-[#1d1d1f] dark:text-white placeholder-slate-400 transition-all focus:bg-white dark:focus:bg-[#333] focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10 border border-transparent focus:border-[#0066cc]/20"
            placeholder="Tìm tài liệu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#2a2a2c] p-1 rounded-[1.5rem] sm:rounded-full w-full sm:w-fit overflow-x-auto no-scrollbar max-w-full">
            {[ALL, ...grades.map((grade) => `Lớp ${grade}`)].map((label) => {
              const value = label === ALL ? ALL : label.replace(/^Lớp\s+/, "");
              return (
                <button
                  key={label}
                  onClick={() => setGradeFilter(value)}
                  className={clsx(
                    "rounded-full px-5 py-2 text-[14px] font-medium transition-all duration-300 whitespace-nowrap",
                    gradeFilter === value
                      ? "bg-white dark:bg-[#444] text-[#1d1d1f] dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {subjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
              {[ALL, ...subjects].map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={clsx(
                    "rounded-full px-4 py-2 text-[14px] font-semibold transition-all border whitespace-nowrap",
                    subjectFilter === subject
                      ? "bg-[#0066cc] text-white border-[#0066cc] shadow-md shadow-blue-500/20"
                      : "bg-white dark:bg-[#2a2a2c] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#0066cc]/30"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}

          {(search || gradeFilter !== ALL || subjectFilter !== ALL) && (
            <div className="flex items-center gap-2 px-1">
              <p className="text-[14px] text-[#1d1d1f]/60 dark:text-white/60">{filteredDocuments.length} kết quả</p>
              <button
                onClick={() => {
                  setSearch("");
                  setGradeFilter(ALL);
                  setSubjectFilter(ALL);
                }}
                className="ml-auto text-[14px] text-[#0066cc] dark:text-[#2997ff] hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] border border-black/5 dark:border-white/5 p-4">
              <div className="skeleton h-44 rounded-[1.5rem] mb-5" />
              <div className="skeleton h-6 w-3/4 mb-3 rounded-full" />
              <div className="skeleton h-4 w-full mb-2 rounded-full" />
              <div className="skeleton h-4 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-black/5 dark:border-white/5 p-16 text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.02em] mb-2">
            Chưa có tài liệu phù hợp
          </p>
          <p className="text-[14px] text-[#1d1d1f]/60 dark:text-white/60">
            Thử thay đổi bộ lọc hoặc upload tài liệu đầu tiên.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <article
              key={document.id}
              className="group flex flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <button
                type="button"
                onClick={() => openDocument(document)}
                className="relative h-44 w-full overflow-hidden text-left"
                aria-label={`Mở ${document.title}`}
              >
                <DocumentThumbnail document={document} />
              </button>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={clsx("rounded-full px-3 py-1 text-[13px] font-semibold", subjectColor(document.subject))}>
                    {document.subject}
                  </span>
                  <span className="rounded-full bg-slate-50 dark:bg-slate-800 px-3 py-1 text-[13px] font-semibold text-slate-500 dark:text-slate-300">
                    Lớp {document.grade}
                  </span>
                </div>

                <button type="button" onClick={() => openDocument(document)} className="text-left">
                  <h3 className="text-[19px] font-bold text-[#1d1d1f] dark:text-white leading-[1.3] tracking-[-0.02em] line-clamp-2 group-hover:text-[#0066cc] dark:group-hover:text-sky-400 transition-colors">
                    {document.title}
                  </h3>
                </button>

                <div className="mt-4 flex flex-col gap-2 text-[13px] text-slate-500 dark:text-slate-400 flex-1">
                  <span>{formatFileSize(document.fileSizeBytes)} · {formatDate(document.createdAt)}</span>
                  {document.uploaderName && <span>Người upload: {document.uploaderName}</span>}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-[#333] pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800 px-3 py-1 text-[12px] font-semibold uppercase text-slate-500 dark:text-slate-300">
                    {document.fileType === "image" ? <FileImage className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {document.fileExtension}
                  </span>
                  <a
                    href={`/api/documents/${document.id}/file?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-4 py-2 text-[14px] font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#005bb5] active:scale-95 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Tải
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white dark:bg-[#1d1d1f] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 p-6 shrink-0">
              <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Upload tài liệu</h3>
              <button
                onClick={() => {
                  if (!uploading) {
                    setUploadOpen(false);
                    resetUpload();
                  }
                }}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5 p-6 overflow-y-auto">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#2a2a2c] p-1 rounded-full w-full">
                <button
                  type="button"
                  onClick={() => setUploadType("file")}
                  className={clsx(
                    "flex-1 rounded-full py-2 text-[14px] font-semibold transition-all",
                    uploadType === "file"
                      ? "bg-white dark:bg-[#444] text-[#1d1d1f] dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-white"
                  )}
                >
                  Tải lên tệp
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("url")}
                  className={clsx(
                    "flex-1 rounded-full py-2 text-[14px] font-semibold transition-all",
                    uploadType === "url"
                      ? "bg-white dark:bg-[#444] text-[#1d1d1f] dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-white"
                  )}
                >
                  Dán link Catbox
                </button>
              </div>

              {uploadType === "file" ? (
                <label className="block">
                  <span className="mb-2 block text-[14px] font-semibold text-slate-700 dark:text-slate-200">Chọn file</span>
                  <input
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.map((item) => `.${item}`).join(",")}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full rounded-[1.25rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2c] p-3 text-[14px] text-slate-700 dark:text-slate-200"
                  />
                  <span className="mt-2 block text-[12px] text-slate-500 dark:text-slate-400">
                    PDF, ảnh hoặc Office. Dung lượng nhỏ hơn 200 MB (Tự động up Catbox cho file ≤ 4MB).
                  </span>
                </label>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-[14px] font-semibold text-slate-700 dark:text-slate-200">Đường dẫn liên kết (URL)</span>
                  <input
                    type="url"
                    value={embedUrl}
                    onChange={(event) => setEmbedUrl(event.target.value)}
                    disabled={uploading}
                    className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2c] px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10"
                    placeholder="https://files.catbox.moe/..."
                    required
                  />
                  <span className="mt-2 block text-[12px] text-slate-500 dark:text-slate-400">
                    Dán link file bạn đã upload thủ công lên Catbox.moe hoặc link công khai bất kỳ.
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-[14px] font-semibold text-slate-700 dark:text-slate-200">Tên tài liệu</span>
                <input
                  value={upload.title}
                  onChange={(event) => setUpload((current) => ({ ...current, title: event.target.value }))}
                  disabled={uploading}
                  className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2c] px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10"
                  placeholder="Ví dụ: Đề ôn tập chương 1"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[14px] font-semibold text-slate-700 dark:text-slate-200">Lớp</span>
                  <input
                    value={upload.grade}
                    onChange={(event) => setUpload((current) => ({ ...current, grade: event.target.value }))}
                    disabled={uploading}
                    className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2c] px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10"
                    placeholder="12"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[14px] font-semibold text-slate-700 dark:text-slate-200">Môn học</span>
                  <input
                    value={upload.subject}
                    onChange={(event) => setUpload((current) => ({ ...current, subject: event.target.value }))}
                    disabled={uploading}
                    className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2c] px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10"
                    placeholder="Toán"
                  />
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#0066cc] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    {uploadStatus || "Đang upload..."} {uploadProgress}%
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0066cc] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                {uploading ? "Đang upload" : "Upload tài liệu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewerDocument && (
        <div className={clsx(
          "fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm p-3 sm:p-6 transition-all duration-200",
          isViewerOpen ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95"
        )}>
          <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-[#1d1d1f] border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 p-4 shrink-0">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[17px] font-bold text-[#1d1d1f] dark:text-white">{viewerDocument.title}</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    Lớp {viewerDocument.grade} · {viewerDocument.subject}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:hidden">
                  <a href={`/api/documents/${viewerDocument.id}/file?download=1`} target="_blank" rel="noreferrer" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10" title="Tải xuống">
                    <Download className="h-5 w-5" />
                  </a>
                  <button type="button" onClick={closeViewer} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10" title="Đóng">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                {viewerDocument.fileType === "pdf" && (
                  <>
                    <div className="flex items-center bg-slate-100 dark:bg-[#2a2a2c] rounded-full px-2 py-0.5">
                      <button onClick={() => setPdfZoom((value) => Math.max(50, value - 10))} className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f]" title="Thu nhỏ">
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{pdfZoom}%</span>
                      <button onClick={() => setPdfZoom((value) => Math.min(200, value + 10))} className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f]" title="Phóng to">
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#2a2a2c] rounded-full px-2 py-0.5">
                      <button
                        onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                        disabled={pdfPage <= 1}
                        className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f] disabled:opacity-40"
                        title="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <label className="flex items-center gap-1 text-[12px] text-slate-600 dark:text-slate-300">
                        <span>Trang</span>
                        <input
                          type="number"
                          min={1}
                          max={numPages || undefined}
                          value={pdfPage}
                          onChange={(event) => {
                            const page = Math.max(1, Number(event.target.value || 1));
                            setPdfPage(numPages ? Math.min(numPages, page) : page);
                          }}
                          className="w-10 rounded-full bg-white dark:bg-[#1d1d1f] px-1 py-0.5 text-center font-semibold"
                        />
                        {numPages && <span className="text-slate-400 dark:text-slate-500">/ {numPages}</span>}
                      </label>

                      <button
                        onClick={() => setPdfPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
                        disabled={!!numPages && pdfPage >= numPages}
                        className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f] disabled:opacity-40"
                        title="Trang sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}

                {viewerDocument.fileType === "image" && (
                  <div className="flex items-center bg-slate-100 dark:bg-[#2a2a2c] rounded-full px-2 py-0.5">
                    <button type="button" onClick={() => setImageZoom((value) => Math.max(0.5, value - 0.25))} className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f]" title="Thu nhỏ">
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{Math.round(imageZoom * 100)}%</span>
                    <button type="button" onClick={() => setImageZoom((value) => Math.min(3, value + 0.25))} className="rounded-full p-1.5 hover:bg-white dark:hover:bg-[#1d1d1f]" title="Phóng to">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1">
                  <a href={`/api/documents/${viewerDocument.id}/file?download=1`} target="_blank" rel="noreferrer" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10" title="Tải xuống">
                    <Download className="h-5 w-5" />
                  </a>
                  <button type="button" onClick={closeViewer} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10" title="Đóng">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div ref={viewerScrollRef} onScroll={() => saveLocalReadingProgress()} className="flex-1 overflow-auto bg-slate-100 dark:bg-black">
              {viewerDocument.fileType === "office" ? (
                <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-[#0066cc] dark:bg-white/10 dark:text-sky-400">
                    <FileArchive className="h-10 w-10" />
                  </div>
                  <h4 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Tài liệu Office không xem trực tiếp trong trình duyệt</h4>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    Bạn có thể tải file về máy để mở bằng Word, Excel hoặc PowerPoint.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`/api/documents/${viewerDocument.id}/file?download=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-5 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] active:scale-95 transition-all"
                    >
                      <Download className="h-5 w-5" />
                      Tải xuống
                    </a>
                  </div>
                </div>
              ) : viewerDocument.fileType === "pdf" ? (
                pdfUrl ? (
                  <div className="flex flex-col items-center justify-start p-4 min-h-[70vh] w-full" ref={pdfContainerRef}>
                    <Document
                      file={pdfSourceBaseUrl}
                      options={DOCUMENT_OPTIONS}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      onLoadError={(error) => {
                        // Suppress expected termination errors when switching files or closing
                        if (error.message?.includes("terminated") || error.message?.includes("destroyed")) {
                          return;
                        }
                        console.error("PDF load error:", error);
                      }}
                      loading={
                        <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                          Đang tải tài liệu...
                        </div>
                      }
                      error={
                        <div className="flex flex-col items-center justify-center p-12 text-red-500 text-center">
                          Lỗi tải file PDF. Vui lòng thử lại hoặc tải xuống để xem.
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pdfPage}
                        width={containerWidth ? Math.max(200, containerWidth - 32) : undefined}
                        scale={pdfZoom / 100}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        onLoadError={(error) => {
                          if (error.message?.includes("terminated") || error.message?.includes("destroyed")) {
                            return;
                          }
                          console.error("Page load error:", error);
                        }}
                        loading={
                          <div className="flex justify-center p-12 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          </div>
                        }
                      />
                    </Document>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[70vh] flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0066cc] mb-4" />
                    <p className="font-semibold text-[15px]">{pdfCacheStatus || "Đang mở tài liệu..."}</p>
                    {pdfCacheProgress !== null && pdfCacheProgress < 100 && (
                      <div className="mt-3 w-64">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0066cc] rounded-full transition-all duration-150"
                            style={{ width: `${pdfCacheProgress}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {pdfCacheProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex min-h-full items-center justify-center p-6 overflow-auto">
                  <img
                    src={`/api/documents/${viewerDocument.id}/file`}
                    alt={viewerDocument.title}
                    className="rounded-[1.5rem] shadow-2xl transition-all duration-200"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      transform: `scale(${imageZoom})`,
                      transformOrigin: "center",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>

            {viewerDocument.fileType === "pdf" && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                <span>
                  Tự động lưu vị trí đọc vào trình duyệt này
                  {lastProgressSavedAt ? ` lúc ${lastProgressSavedAt}` : ""}.
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-[#2a2a2c] px-4 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  Trang {pdfPage} {numPages ? `/ ${numPages}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
