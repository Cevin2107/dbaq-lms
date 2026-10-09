import { HeaderBar } from "@/components/HeaderBar";
import { ScheduleRegistrationPanel } from "@/features/schedule/ScheduleRegistrationPanel";
import { Footer } from "@/components/Footer";

export default function RegisterSchedulePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] flex flex-col justify-between transition-colors duration-500 relative overflow-hidden">
      {/* Soft background ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] transform-gpu" />
        <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-500/10 dark:bg-sky-600/10 blur-[140px] transform-gpu" />
      </div>

      <main className="pt-24 sm:pt-28 flex-1 relative z-10">
        <HeaderBar />
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pb-16">
          <ScheduleRegistrationPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
