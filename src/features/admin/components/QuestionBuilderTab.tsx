import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { countActualQuestions } from "@/lib/utils";
import { AiGeneratorModal } from "./AiGeneratorModal";
import { QuestionEditorModal } from "./QuestionEditorModal";
import { GripVertical, Plus, Settings2, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import Toast from "@/components/Toast";
import { MathText } from "@/components/MathText";
import { broadcastQuestionsUpdate } from "@/lib/broadcastQuestions";

export function QuestionBuilderTab({ assignmentId, initialQuestions }: { assignmentId: string; initialQuestions: any[] }) {
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Auto reload questions after AI generation or changes
  const refreshQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/questions?assignmentId=${assignmentId}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setToast({ message: "Không thể tải danh sách câu hỏi", type: "error" });
    }
  }, [assignmentId]);

  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get cursor position relative to viewport
    const cursorY = e.clientY;
    const viewportHeight = window.innerHeight;
    const scrollThreshold = 100; // pixels from edge
    const scrollSpeed = 10; // pixels per interval
    
    // Clear existing interval
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
    
    // Scroll up if near top
    if (cursorY < scrollThreshold) {
      const interval = setInterval(() => {
        window.scrollBy(0, -scrollSpeed);
      }, 16); // ~60fps
      setAutoScrollInterval(interval);
    }
    // Scroll down if near bottom
    else if (cursorY > viewportHeight - scrollThreshold) {
      const interval = setInterval(() => {
        window.scrollBy(0, scrollSpeed);
      }, 16);
      setAutoScrollInterval(interval);
    }
  };

  const handleDragEnd = () => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const oldIndex = questions.findIndex(q => q.id === draggedId);
    const newIndex = questions.findIndex(q => q.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newArr = [...questions];
    const [moved] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, moved);
    setQuestions(newArr);
    
    // Call API to reorder
    try {
      const res = await fetch("/api/admin/questions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          orderedIds: newArr.map(q => q.id),
        }),
      });
      if (!res.ok) {
        throw new Error("Reorder failed");
      }
      broadcastQuestionsUpdate(assignmentId);
      setToast({ message: "Sắp xếp thành công", type: "success" });
    } catch {
      setToast({ message: "Sắp xếp thất bại", type: "error" });
      refreshQuestions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      broadcastQuestionsUpdate(assignmentId);
      setToast({ message: "Xóa thành công", type: "success" });
      refreshQuestions();
    } catch (e) {
      setToast({ message: "Lỗi khi xóa", type: "error" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xóa ${selectedIds.size} câu hỏi đã chọn?`)) return;
    
    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/admin/questions`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          questionIds: Array.from(selectedIds)
        })
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      broadcastQuestionsUpdate(assignmentId);
      setToast({ message: `Đã xóa ${selectedIds.size} câu hỏi`, type: "success" });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      refreshQuestions();
    } catch (e) {
      setToast({ message: "Lỗi khi xóa hàng loạt", type: "error" });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-5 sm:p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Bộ câu hỏi bài tập</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sắp xếp, chỉnh sửa và tạo câu hỏi cho bài tập này. 
            {questions.length > 0 && (
              <span className="font-bold text-[#0066cc] dark:text-blue-400 block sm:inline">
                {" "}({countActualQuestions(questions)} câu hỏi, {questions.length - countActualQuestions(questions)} ghi chú)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isSelectionMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="rounded-full text-xs font-semibold px-4 py-2">
                 Hủy
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSelectAll} className="rounded-full text-xs font-semibold px-4 py-2">
                 {selectedIds.size === questions.length ? "Bỏ chọn hết" : "Chọn hết"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedIds.size === 0 || isDeletingBulk} className="rounded-full text-xs font-semibold px-5 py-2 shadow-md shadow-red-500/20 active:scale-95 transition-all">
                 <Trash2 className="h-4 w-4 mr-1.5" /> Xóa ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              {questions.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)} className="rounded-full bg-white/80 dark:bg-white/5 border-black/[0.06] dark:border-white/10 text-xs font-semibold px-4 py-2 hover:bg-black/[0.04] dark:hover:bg-white/10 active:scale-95 transition-all">
                   Chọn nhiều
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setEditingQuestion(null); setShowEditorModal(true); }} className="rounded-full bg-white/80 dark:bg-white/5 border-black/[0.06] dark:border-white/10 text-xs font-semibold px-4 py-2 hover:bg-black/[0.04] dark:hover:bg-white/10 active:scale-95 transition-all">
                 <Plus className="h-4 w-4 mr-1.5" /> Thủ công
              </Button>
              <Button variant="brand" size="sm" onClick={() => setShowAiModal(true)} className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/25 px-5 py-2 text-xs font-semibold active:scale-95 transition-all duration-300 ease-spring">
                 <Settings2 className="h-4 w-4 mr-1.5" /> Auto tạo câu hỏi
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400 flex items-center justify-center font-bold mb-4">
              <Settings2 className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có câu hỏi nào</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Bóc tách tự động và import đáp án cho câu hỏi trắc nghiệm, đúng/sai, trả lời ngắn.</p>
            <Button variant="brand" onClick={() => setShowAiModal(true)} className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/25 px-6 py-2.5 text-xs font-semibold active:scale-95 transition-all">
              Auto tạo câu hỏi
            </Button>
          </div>
        ) : (
          questions.map((q) => (
            <div 
              key={q.id} 
              className={`flex items-start p-5 sm:p-6 transition-all duration-300 ease-spring rounded-[2.25rem] border backdrop-blur-2xl ${q.type === 'section' ? 'border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/20' : 'border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]'} hover:shadow-md hover:border-blue-500/30 ${isSelectionMode ? 'cursor-pointer' : 'cursor-move'} ${selectedIds.has(q.id) ? 'ring-2 ring-indigo-500' : ''}`}
              draggable={!isSelectionMode}
              onDragStart={(e) => { if(!isSelectionMode) setDraggedId(q.id); else e.preventDefault(); }}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={() => handleDrop(q.id)}
              onClick={() => isSelectionMode && toggleSelection(q.id)}
            >
              {isSelectionMode ? (
                <div className="mr-4 mt-1">
                  <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => {}} className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none" />
                </div>
              ) : (
                <div className="mr-4 mt-1 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400">
                   <GripVertical className="h-5 w-5" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {q.type !== 'section' && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-[#0066cc] dark:text-blue-300 border border-blue-500/20">
                      Câu {questions.filter(x => x.type !== 'section').findIndex(x => x.id === q.id) + 1}
                    </span>
                  )}
                  {q.type === 'section' && <Badge variant="default">Đoạn văn / Ghi chú</Badge>}
                  {q.type === 'essay' && <Badge variant="warning">Tự luận</Badge>}
                  {q.type === 'true_false' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">Đúng/Sai</span>}
                  {q.type === 'short_answer' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">Trả lời ngắn</span>}
                  {q.points > 0 && <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">{q.points} điểm</span>}
                </div>
                
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed max-w-full break-words overflow-hidden"><MathText text={q.content || ""} /></div>

                {(q.imageUrl || q.image_url) && <img src={q.imageUrl || q.image_url} alt="img" className="mt-3 max-w-xs rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm" />}

                {q.type === "mcq" && q.choices && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {q.choices.map((c: string, i: number) => {
                      const isCorrect = String.fromCharCode(65 + i) === (q.answerKey || q.answer_key);
                      return (
                        <div key={i} className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 ${isCorrect ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 shadow-xs' : 'bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200'}`}>
                           <span className="font-extrabold text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + i)}.</span>
                           <span className="flex-1 break-words"><MathText text={c || ""} /></span>
                           {isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === "true_false" && (q.subQuestions || q.sub_questions) && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {(q.subQuestions || q.sub_questions).map((sq: any, i: number) => (
                      <div key={sq.id || i} className="flex justify-between items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200">
                         <div className="flex gap-2">
                           <span className="font-extrabold text-slate-400 dark:text-slate-500">{String.fromCharCode(97 + i)}.</span>
                           <span className="text-slate-800 dark:text-slate-200"><MathText text={sq.content || ""} /></span>
                         </div>
                         <Badge variant={sq.answerKey === "true" || sq.answer_key === "true" ? "success" : "destructive"} className="shrink-0 text-xs py-0.5 rounded-full">
                           {sq.answerKey === "true" || sq.answer_key === "true" ? "Đúng" : "Sai"}
                         </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "short_answer" && (
                  <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đáp án:</span>
                    <span className="break-words">
                      <MathText text={q.answerKey || q.answer_key || "(Chưa thiết lập)"} />
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 shrink-0">
                 {!isSelectionMode && (
                   <>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-500 hover:text-[#0066cc] dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all" onClick={(e) => { e.stopPropagation(); setEditingQuestion(q); setShowEditorModal(true); }}>
                        <Edit2 className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 transition-all" onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                   </>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      <AiGeneratorModal 
        assignmentId={assignmentId} 
        isOpen={showAiModal} 
        onClose={() => setShowAiModal(false)}
        onSuccess={refreshQuestions}
      />
      
      <QuestionEditorModal
        assignmentId={assignmentId}
        isOpen={showEditorModal}
        onClose={() => { setShowEditorModal(false); setEditingQuestion(null); }}
        onSuccess={refreshQuestions}
        editingQuestion={editingQuestion}
      />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
