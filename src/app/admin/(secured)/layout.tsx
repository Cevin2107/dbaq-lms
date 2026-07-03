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
      <main className="flex-1 overflow-auto relative">
        <div className="min-h-full pb-20 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
