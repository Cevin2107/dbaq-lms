"use client";

import { useState } from "react";
import { OverviewTab } from "./OverviewTab";
import { QuestionBuilderTab } from "./QuestionBuilderTab";
import { StudentSessionsTab } from "./StudentSessionsTab";
import { AssignTab } from "./AssignTab";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Settings, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/MathText";

interface AssignmentDetailTabsProps {
  assignmentId: string;
  initialAssignment: any;
  initialQuestions: any[];
}

export function AssignmentDetailTabs({ assignmentId, initialAssignment, initialQuestions }: AssignmentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "students" | "assign">("overview");
  const isQuiz = initialAssignment?.type === "QUIZ";
  
  const TABS = [
    { id: "overview", label: "Tổng quan & Cài đặt", shortLabel: "Tổng quan", icon: Settings },
    { id: "questions", label: "Bộ câu hỏi", shortLabel: "Câu hỏi", icon: ListChecks },
    { id: "students", label: "Học sinh & Chấm điểm", shortLabel: "Học sinh", icon: Users },
    { id: "assign", label: "Giao bài", shortLabel: "Giao bài", icon: Users },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 px-4 py-5 pb-20 animate-fade-in transition-colors duration-500 sm:space-y-6 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:pb-8">
      <div className="relative flex flex-col gap-3 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#18181b]/80 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] sm:gap-4 sm:rounded-[2rem] sm:p-7">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <Link href="/admin/assignments">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold active:scale-95 transition-all">
               <ArrowLeft className="h-4 w-4 mr-1.5" />
               Quay lại danh sách
            </Button>
          </Link>
          <div className="flex items-center gap-3.5">
             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#0052a3] shadow-md shadow-blue-500/25 text-white">
                <Settings className="h-5 w-5" />
             </div>
             <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-[-0.02em] line-clamp-2">
                  <MathText text={initialAssignment?.title || "Chi tiết bài tập"} />
                </h1>
                {isQuiz && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                    QUIZ
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Quản lý cấu hình, ngân hàng câu hỏi và chấm điểm bài nộp học sinh.</p>
             </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#18181b]/80 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:rounded-[2rem] sm:p-2">
        <nav className="flex min-w-0 gap-1 overflow-x-auto scrollbar-hide sm:gap-2" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "group inline-flex items-center rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 ease-spring whitespace-nowrap flex-shrink-0 active:scale-95",
                  isActive
                    ? "bg-blue-500/10 text-[#0066cc] dark:text-blue-300 border border-blue-500/20 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "mr-1.5 sm:mr-2 h-4 w-4 transition-colors flex-shrink-0",
                    isActive ? "text-[#0066cc] dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab assignmentId={assignmentId} initialData={initialAssignment} />
        )}
        {activeTab === "questions" && (
          <QuestionBuilderTab assignmentId={assignmentId} initialQuestions={initialQuestions} isQuiz={isQuiz} />
        )}
        {activeTab === "students" && (
          <StudentSessionsTab assignmentId={assignmentId} />
        )}
        {activeTab === "assign" && (
          <AssignTab assignmentId={assignmentId} />
        )}
      </div>
    </div>
  );
}
