import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { HeaderBar } from "@/components/HeaderBar";
import { HomeTabs } from "@/features/home/HomeTabs";
import { fetchAssignmentsWithHistory } from "@/lib/supabaseHelpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gia sư Đào Bá Anh Quân",
  description: "Xem bài tập, đăng ký lịch học và đọc tài liệu học tập trực tuyến.",
  openGraph: {
    title: "Gia sư Đào Bá Anh Quân",
    description: "Xem bài tập, đăng ký lịch học và đọc tài liệu học tập trực tuyến.",
    siteName: "Gia sư Đào Bá Anh Quân",
  },
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Ignore in this server component.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const currentHour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  ).getHours();

  const greetingKind =
    currentHour >= 12 && currentHour < 18
      ? "afternoon"
      : currentHour >= 18 || currentHour < 5
        ? "evening"
        : "morning";

  const greeting =
    greetingKind === "afternoon"
      ? "Chào buổi chiều"
      : greetingKind === "evening"
        ? "Chào buổi tối"
        : "Chào buổi sáng";

  const fullName = user.user_metadata?.full_name as string | undefined;
  const assignments = await fetchAssignmentsWithHistory(user.id, fullName);

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] relative pt-24 sm:pt-28">
      <HeaderBar studentName={fullName} />
      <HomeTabs
        assignments={assignments}
        studentName={fullName}
        greeting={greeting}
        greetingKind={greetingKind}
      />
    </main>
  );
}
