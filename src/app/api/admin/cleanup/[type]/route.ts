import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteAssignment, deleteQuestion, updateQuestion } from "@/lib/supabaseHelpers";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await params;
    const supabase = createSupabaseAdmin();
    let items: any[] = [];

    switch (type) {
      case "assignments": {
        const { data, error } = await supabase
          .from("assignments")
          .select("id, title, subject, grade, created_at, is_hidden")
          .order("created_at", { ascending: false });

        if (error) throw error;

        items = ((data as any[]) || []).map((a) => ({
          id: a.id,
          name: a.title,
          info: `${a.subject} - ${a.grade} ${a.is_hidden ? "(Ẩn)" : ""}`,
        }));
        break;
      }

      case "questions": {
        const { data, error } = await supabase
          .from("questions")
          .select(`
            id,
            content,
            type,
            points,
            assignment_id,
            assignments (title)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        items = ((data as any[]) || []).map((q) => {
          const assignmentTitle = (q.assignments as { title?: string } | null)?.title || "N/A";
          return {
            id: q.id,
            name: q.content || `Câu ${q.type === "mcq" ? "trắc nghiệm" : "tự luận"}`,
            info: `${assignmentTitle} - ${q.points} điểm`,
          };
        });
        break;
      }

      case "submissions": {
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            id,
            student_name,
            score,
            submitted_at,
            assignments (title)
          `)
          .order("submitted_at", { ascending: false });

        if (error) throw error;

        items = ((data as any[]) || []).map((s) => {
          const assignmentTitle = (s.assignments as { title?: string } | null)?.title || "N/A";
          return {
            id: s.id,
            name: `${s.student_name} - ${assignmentTitle}`,
            info: `${s.score}/10 - ${new Date(s.submitted_at).toLocaleDateString("vi-VN")}`,
          };
        });
        break;
      }

      case "sessions": {
        const { data, error } = await supabase
          .from("student_sessions")
          .select(`
            id,
            student_name,
            started_at,
            assignments (title)
          `)
          .order("started_at", { ascending: false });

        if (error) throw error;

        items = ((data as any[]) || []).map((s) => {
          const assignmentTitle = (s.assignments as { title?: string } | null)?.title || "N/A";
          return {
            id: s.id,
            name: `${s.student_name} - ${assignmentTitle}`,
            info: `Bắt đầu: ${new Date(s.started_at).toLocaleDateString("vi-VN")}`,
          };
        });
        break;
      }

      case "images": {
        // Get all image URLs from questions with assignment info
        const { data, error } = await supabase
          .from("questions")
          .select(`
            id,
            image_url,
            content,
            assignment_id,
            assignments (title, subject, grade)
          `)
          .not("image_url", "is", null)
          .order("assignment_id", { ascending: true });

        if (error) throw error;

        items = ((data as any[]) || [])
          .filter((q) => q.image_url)
          .map((q) => {
            const assignment = q.assignments as { title?: string; subject?: string; grade?: string } | null;
            const assignmentTitle = assignment?.title || "N/A";
            const assignmentInfo = assignment 
              ? `${assignment.subject} - ${assignment.grade}` 
              : "Không có bài tập";
            
            return {
              id: q.id,
              name: q.image_url || "",
              info: `📝 ${assignmentTitle} | ${assignmentInfo} | ${q.content?.substring(0, 40) || "Không có nội dung"}`,
              assignmentId: q.assignment_id,
              assignmentTitle: assignmentTitle,
            };
          });
        break;
      }

      case "documents": {
        const { data, error } = await supabase
          .from("documents")
          .select("id, title, file_type, file_extension, file_size_bytes, grade, subject")
          .order("created_at", { ascending: false });

        if (error) throw error;

        items = ((data as any[]) || []).map((d) => ({
          id: d.id,
          name: d.title,
          info: `${d.subject} - Lớp ${d.grade} (${d.file_extension.toUpperCase()})`,
          size: formatBytes(d.file_size_bytes),
        }));
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cleanup items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await params;
    const body = await req.json();
    const { ids }: { ids: string[] } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    switch (type) {
      case "assignments": {
        for (const id of ids) {
          try {
            await deleteAssignment(id);
          } catch (error) {
            console.error(`Error deleting assignment ${id}:`, error);
          }
        }
        break;
      }

      case "questions": {
        for (const id of ids) {
          try {
            await deleteQuestion(id);
          } catch (error) {
            console.error(`Error deleting question ${id}:`, error);
          }
        }
        break;
      }

      case "submissions": {
        for (const id of ids) {
          const { error } = await (supabase.from("submissions") as any)
            .delete()
            .eq("id", id);
          if (error) console.error(`Error deleting submission ${id}:`, error);
        }
        break;
      }

      case "sessions": {
        for (const id of ids) {
          const { error } = await (supabase.from("student_sessions") as any)
            .delete()
            .eq("id", id);
          if (error) console.error(`Error deleting session ${id}:`, error);
        }
        break;
      }

      case "images": {
        // For images, we update questions to remove image_url, which triggers deletion on Catbox/Supabase
        for (const id of ids) {
          try {
            await updateQuestion(id, { imageUrl: null });
          } catch (error) {
            console.error(`Error removing image from question ${id}:`, error);
          }
        }
        break;
      }

      case "documents": {
        for (const id of ids) {
          const { error } = await (supabase.from("documents") as any)
            .delete()
            .eq("id", id);
          if (error) console.error(`Error deleting document ${id}:`, error);
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Error deleting items:", error);
    return NextResponse.json(
      { error: "Failed to delete items" },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
