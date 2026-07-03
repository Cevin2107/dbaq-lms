import { HeaderBar } from "@/components/HeaderBar";
import { AssignmentList } from "@/components/AssignmentList";
import { fetchAssignmentsWithHistory } from "@/lib/supabaseHelpers";
import type { Metadata } from "next";
import Image from "next/image";
import bgImg from "./bg.jpg";
import { Sun, Moon, CloudSun } from "lucide-react";

// Disable caching để luôn hiển thị dữ liệu mới nhất
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Danh sách bài tập - Gia sư Đào Bá Anh Quân",
  description: "Xem và làm bài tập trực tuyến. Hoàn thành đúng hạn, được làm lại nhiều lần, tự động lưu nháp.",
  openGraph: {
    title: "Danh sách bài tập - Gia sư Đào Bá Anh Quân",
    description: "Xem và làm bài tập trực tuyến. Hoàn thành đúng hạn, được làm lại nhiều lần.",
    siteName: "Gia sư Đào Bá Anh Quân",
  },
};

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
        setAll(cookiesToSet) {
          // Ignore
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null; // Handled by middleware
  }

  const currentHour = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"})).getHours();
  let greeting = "Chào buổi sáng";
  let GreetingIcon = Sun;
  let iconColor = "text-amber-500 dark:text-amber-400";
  
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Chào buổi chiều";
    GreetingIcon = CloudSun;
    iconColor = "text-orange-500 dark:text-orange-400";
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = "Chào buổi tối";
    GreetingIcon = Moon;
    iconColor = "text-indigo-500 dark:text-indigo-400";
  }

  const assignments = await fetchAssignmentsWithHistory(user.id, user.user_metadata?.full_name);

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] relative pt-24 sm:pt-28">

      <HeaderBar studentName={user.user_metadata?.full_name} />

      {/* Hero Section - Floating Rounded Tile */}
      <div className="px-4 sm:px-6 md:px-8">
        <div className="relative w-full max-w-[1440px] mx-auto rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] dark:from-[#1a1c23] dark:via-[#151921] dark:to-[#0f172a] border border-[#bae6fd]/30 dark:border-white/10 shadow-[0_8px_30px_rgba(0,102,204,0.08)]">
          
          <div className="relative z-10 py-16 sm:py-24 md:py-28 px-6 sm:px-12 lg:px-20 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
            
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left max-w-2xl flex flex-col items-center md:items-start w-full">
              
              {/* Badge */}
              <div className="mb-6 inline-flex px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 order-1">
                <span className="text-[12px] font-medium tracking-tight text-[#1d1d1f] dark:text-white/90 uppercase">
                  Hệ thống bài tập trực tuyến
                </span>
              </div>

              {/* Mobile Image */}
              <div className="md:hidden w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-[24px] overflow-hidden mb-0 relative shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] order-2">
                  <Image
                    src={bgImg}
                    alt="Đào Bá Anh Quân"
                    fill
                    className="object-cover object-[center_35%]"
                    priority
                  />
              </div>

              {/* Brand Title (Overlapping on Mobile) */}
              <div className="mb-4 md:mb-8 relative z-10 -mt-6 md:-mt-0 order-3">
                <h1 className="text-[22px] sm:text-[32px] md:text-[56px] lg:text-[72px] font-bold md:font-semibold leading-[1.07] tracking-[-0.02em] text-[#1d1d1f] dark:text-white whitespace-nowrap bg-white/70 dark:bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none px-4 py-2 rounded-2xl md:p-0 md:rounded-none border border-white/40 md:border-transparent shadow-sm md:shadow-none">
                  Gia sư Đào Bá Anh Quân
                </h1>
              </div>
              
              {/* Greeting & Subtitle */}
              <div className="flex flex-col items-center md:items-start order-4">
                <div className="flex items-center justify-center md:justify-start gap-2.5 text-[19px] sm:text-[24px] md:text-[28px] font-normal text-[#1d1d1f]/80 dark:text-white/80 tracking-tight leading-[1.3]">
                  <GreetingIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
                  <h2>
                    {greeting}, <span className="font-semibold text-[#1d1d1f] dark:text-white">{user.user_metadata?.full_name || "Học sinh"}</span>.
                  </h2>
                </div>
                <p className="mt-3 text-[15px] sm:text-[17px] text-[#1d1d1f]/60 dark:text-white/50 tracking-tight text-center md:text-left max-w-[90%] md:max-w-lg">
                  Nền tảng giao bài và làm bài tập trực tuyến. Theo dõi tiến độ, lưu nháp tự động và ôn tập dễ dàng.
                </p>
              </div>
            </div>

            {/* Desktop Image */}
            <div className="hidden md:block shrink-0 relative w-72 h-72 lg:w-[380px] lg:h-[380px]">
               <div className="relative w-full h-full rounded-[18px] overflow-hidden shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px]">
                  <Image
                    src={bgImg}
                    alt="Đào Bá Anh Quân"
                    fill
                    className="object-cover object-[center_35%]"
                    priority
                  />
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 mt-8 pb-16 relative" suppressHydrationWarning>
        <AssignmentList assignments={assignments} />
      </div>
    </main>
  );
}
