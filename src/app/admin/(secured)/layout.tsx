import { checkAdminAuth } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    redirect("/admin");
  }

  return (
    <div className="relative isolate flex h-dvh min-h-0 overflow-hidden bg-[#f5f5f7] transition-colors duration-500 dark:bg-[#000000]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
        <div className="absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-blue-500/[0.08] blur-[140px] transform-gpu dark:bg-blue-600/15" />
        <div className="absolute -bottom-40 left-1/4 h-[550px] w-[550px] rounded-full bg-indigo-500/[0.08] blur-[140px] transform-gpu dark:bg-sky-600/10" />
      </div>

      <AdminSidebar />
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3 lg:p-4">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.5rem] border border-white/80 bg-white/85 shadow-[0_16px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl transform-gpu dark:border-white/10 dark:bg-[#18181b]/90 dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)] sm:rounded-[2rem] lg:rounded-[2.5rem]">
          <div className="flex min-h-full flex-1 flex-col justify-between pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
            <div className="min-w-0 flex-1">
              {children}
            </div>
            <Footer variant="admin" className="mt-8 rounded-b-[1.5rem] sm:rounded-b-[2rem] lg:rounded-b-[2.5rem]" />
          </div>
        </div>
      </main>
    </div>
  );
}
