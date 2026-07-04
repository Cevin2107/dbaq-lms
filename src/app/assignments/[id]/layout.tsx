import type { Metadata } from "next";
import { fetchAssignmentById } from "@/lib/supabaseHelpers";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  console.log("=== GENERATING METADATA FOR ID:", id);
  const assignment = await fetchAssignmentById(id);
  const title = assignment ? `📝 ${assignment.title} 🔸 Gia sư Đào Bá Anh Quân` : "📝 Bài tập 🔸 Gia sư Đào Bá Anh Quân";
  const description = assignment ? `Làm bài tập: ${assignment.title} - Môn học: ${assignment.subject}.` : "Hệ thống bài tập trực tuyến.";

  const result = {
    metadataBase: new URL("https://dbaq-lms.vercel.app"),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Gia sư Đào Bá Anh Quân",
      images: ["https://dbaq-lms.vercel.app/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://dbaq-lms.vercel.app/og-image.png"],
    }
  };
  console.log("=== METADATA RESULT ===", JSON.stringify(result, null, 2));
  return result;
}

export default function AssignmentLayout({ children }: Props) {
  return <>{children}</>;
}
