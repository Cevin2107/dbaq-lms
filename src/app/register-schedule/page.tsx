import { HeaderBar } from "@/components/HeaderBar";
import { ScheduleRegistrationPanel } from "@/features/schedule/ScheduleRegistrationPanel";
import { Footer } from "@/components/Footer";

export default function RegisterSchedulePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] flex flex-col justify-between transition-colors duration-500">
      <main className="pt-20 sm:pt-24 flex-1">
        <HeaderBar />
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 mt-4 pb-16">
          <ScheduleRegistrationPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
