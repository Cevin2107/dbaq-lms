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
  const assignment = await fetchAssignmentById(id);
  const title = assignment ? `📝 ${assignment.title} 🔸 Gia sư Đào Bá Anh Quân` : "📝 Bài tập 🔸 Gia sư Đào Bá Anh Quân";
  const description = assignment ? `Làm bài tập: ${assignment.title} - Môn học: ${assignment.subject}.` : "Hệ thống bài tập trực tuyến.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Gia sư Đào Bá Anh Quân",
      images: [
        {
          url: "/og-image.png",
          width: 512,
          height: 512,
          alt: "Gia sư Đào Bá Anh Quân",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    }
  };
}

export default function AssignmentLayout({ children }: Props) {
  return <>{children}</>;
}
