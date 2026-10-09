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
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-[#0a0a0a] relative transition-colors duration-500">
      {/* Soft background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
        <div className="absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[140px] transform-gpu" />
        <div className="absolute -bottom-40 left-1/4 h-[550px] w-[550px] rounded-full bg-indigo-500/10 dark:bg-sky-600/10 blur-[140px] transform-gpu" />
      </div>

      <AdminSidebar />
      <main className="flex-1 overflow-hidden relative flex flex-col p-2.5 sm:p-3.5 lg:p-4 z-10">
        <div className="flex-1 overflow-auto bg-white/85 dark:bg-[#18181b]/90 backdrop-blur-2xl transform-gpu rounded-[2.5rem] shadow-[0_16px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)] border border-white/80 dark:border-white/10 relative">
          <div className="min-h-full flex flex-col justify-between pb-24 lg:pb-0">
            <div>
              {children}
            </div>
            <Footer variant="admin" className="rounded-b-[2.5rem] mt-8" />
          </div>
        </div>
      </main>
    </div>
  );
}
