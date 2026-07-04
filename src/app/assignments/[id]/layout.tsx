import type { Metadata, ResolvingMetadata } from "next";
import { fetchAssignmentById } from "@/lib/supabaseHelpers";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const assignment = await fetchAssignmentById(id);
  const title = assignment ? `📝 ${assignment.title} 🔸 Gia sư Đào Bá Anh Quân` : "📝 Bài tập 🔸 Gia sư Đào Bá Anh Quân";
  const description = assignment ? `Làm bài tập: ${assignment.title} - Môn học: ${assignment.subject}.` : "Hệ thống bài tập trực tuyến.";

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Gia sư Đào Bá Anh Quân",
      images: previousImages,
    },
    twitter: {
      title,
      description,
      images: previousImages,
    }
  };
}

export default function AssignmentLayout({ children }: Props) {
  return <>{children}</>;
}
