import { HeaderBar } from "@/components/HeaderBar";
import { ScheduleRegistrationPanel } from "@/features/schedule/ScheduleRegistrationPanel";

export default function RegisterSchedulePage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500 pt-20 sm:pt-24 pb-16">
      <HeaderBar />
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 mt-4 pb-16">
        <ScheduleRegistrationPanel />
      </div>
    </main>
  );
}
