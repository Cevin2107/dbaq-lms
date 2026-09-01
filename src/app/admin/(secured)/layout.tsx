import { checkAdminAuth } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

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
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-black relative">
      {/* Soft background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-200/20 dark:bg-blue-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-200/20 dark:bg-sky-900/20 blur-[120px]" />
      </div>

      <AdminSidebar />
      <main className="flex-1 overflow-hidden relative flex flex-col p-2 sm:p-3 lg:p-4">
        <div className="flex-1 overflow-auto bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-md transform-gpu rounded-[2rem] shadow-glass border border-white/40 dark:border-white/10 relative">
          <div className="min-h-full pb-24 lg:pb-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
