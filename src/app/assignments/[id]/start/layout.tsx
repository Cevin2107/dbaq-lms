import type { Metadata } from "next";
import { fetchAssignmentByIdAdmin } from "@/lib/supabaseHelpers";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = appUrl || "https://dbaq-lms.vercel.app";
  const metadataBase = new URL(baseUrl);
  const startPath = `/assignments/${id}/start`;

  try {
    const assignment = await fetchAssignmentByIdAdmin(id);

    if (assignment) {
      const title = `📝 ${assignment.title} 🔹 Gia sư Đào Bá Anh Quân`;
      const description = `Bài tập ${assignment.subject} ${assignment.grade}. Hệ thống LMS của Gia sư Đào Bá Anh Quân`;

      return {
        metadataBase,
        title,
        description,
        alternates: {
          canonical: startPath,
        },
        openGraph: {
          title,
          description,
          url: startPath,
          siteName: "Gia sư Đào Bá Anh Quân",
          locale: "vi_VN",
          type: "website",
          images: [
            {
              url: "/og-image.png?v=5",
              width: 1200,
              height: 630,
              alt: "Gia sư Đào Bá Anh Quân - ĐBAQ LMS",
            }
          ],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: ["/og-image.png?v=5"],
        },
      };
    }
  } catch (error) {
    console.error("Error fetching assignment for metadata:", error);
  }

  return {
    metadataBase,
    title: "📝 Bài tập 🔹 Gia sư Đào Bá Anh Quân",
    description: "Hệ thống bài tập trực tuyến",
    alternates: {
      canonical: startPath,
    },
    openGraph: {
      title: "📝 Bài tập 🔹 Gia sư Đào Bá Anh Quân",
      description: "Hệ thống bài tập trực tuyến",
      url: startPath,
      siteName: "Gia sư Đào Bá Anh Quân",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: "/og-image.png?v=5",
          width: 1200,
          height: 630,
          alt: "Gia sư Đào Bá Anh Quân - ĐBAQ LMS",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "📝 Bài tập 🔹 Gia sư Đào Bá Anh Quân",
      description: "Hệ thống bài tập trực tuyến",
      images: ["/og-image.png?v=5"],
    },
  };
}

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
