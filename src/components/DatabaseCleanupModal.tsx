"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  BookOpen,
  X,
  Package,
  RefreshCw,
  Check,
} from "lucide-react";

interface CleanupItem {
  id: string;
  name: string;
  info?: string;
  size?: string;
  assignmentId?: string;
  assignmentTitle?: string;
}

interface CleanupTabProps {
  type: "assignments" | "images" | "submissions" | "sessions" | "documents";
}

function CustomCheckbox({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
        id={id}
      />
      <label
        htmlFor={id}
        className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a1c23] flex items-center justify-center cursor-pointer transition-all duration-200 peer-checked:bg-[#0066cc] peer-checked:border-[#0066cc] text-transparent peer-checked:text-white hover:scale-105 shadow-xs"
      >
        <Check className="w-3 h-3 stroke-[3]" />
      </label>
    </div>
  );
}

export default function DatabaseCleanupModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<CleanupTabProps["type"]>("assignments");
  const [items, setItems] = useState<CleanupItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { key: "assignments" as const, label: "Bài tập", icon: FileText },
    { key: "submissions" as const, label: "Bài nộp", icon: CheckCircle2 },
    { key: "sessions" as const, label: "Phiên học", icon: Clock },
    { key: "images" as const, label: "Hình ảnh", icon: ImageIcon },
    { key: "documents" as const, label: "Tài liệu", icon: BookOpen },
  ];

  const loadItems = async (type: CleanupTabProps["type"]) => {
    setLoading(true);
    setSelectedItems(new Set());
    try {
      const res = await fetch(`/api/admin/cleanup/${type}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadItems(activeTab);
    }
  }, [mounted, activeTab]);

  const handleTabChange = (tab: CleanupTabProps["type"]) => {
    setActiveTab(tab);
  };

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  const toggleAssignmentGroup = (groupItems: CleanupItem[]) => {
    const groupIds = groupItems.map((item) => item.id);
    const allSelected = groupIds.every((id) => selectedItems.has(id));

    const newSet = new Set(selectedItems);
    if (allSelected) {
      groupIds.forEach((id) => newSet.delete(id));
    } else {
      groupIds.forEach((id) => newSet.add(id));
    }
    setSelectedItems(newSet);
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      addToast({
        title: "Chưa chọn mục",
        description: "Vui lòng chọn ít nhất một mục để xóa",
        variant: "warning",
      });
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.size} mục đã chọn? Hành động này không thể hoàn tác!`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cleanup/${activeTab}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (res.ok) {
        addToast({
          title: "Xóa thành công",
          description: `Đã xóa thành công ${selectedItems.size} mục được chọn`,
          variant: "success",
        });
        loadItems(activeTab);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      addToast({
        title: "Lỗi xóa dữ liệu",
        description: "Có lỗi xảy ra khi thực hiện dọn dẹp dữ liệu",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
      <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col transition-all">
        
        {/* Header */}
        <div className="relative z-20 overflow-hidden border-b border-black/5 dark:border-white/5 px-6 sm:px-8 py-5 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 via-white/20 to-blue-50/30 dark:from-red-950/20 dark:via-[#1d1d1f]/10 dark:to-blue-950/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/40 shadow-inner">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-extrabold text-slate-900 dark:text-white tracking-[-0.02em] leading-tight">
                  Dọn dẹp Database
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Giải phóng dung lượng bằng cách xóa các tệp và dữ liệu cũ không cần thiết
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 shadow-xs font-bold"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs - iOS-style Segmented Control */}
        <div className="px-6 sm:px-8 py-4 border-b border-black/5 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/70 rounded-full overflow-x-auto no-scrollbar max-w-full shadow-inner border border-black/5 dark:border-white/5">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-white dark:bg-[#252528] text-[#0066cc] dark:text-blue-400 shadow-md shadow-blue-500/10 border border-blue-500/20 scale-[1.02]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-0 flex-1 overflow-y-auto p-6 sm:p-8" style={{ isolation: "isolate" }}>
          {!loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 shadow-inner">
                <Package className="w-8 h-8" />
              </div>
              <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200">Không có dữ liệu cần dọn dẹp</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Danh mục này hiện không có mục nào có thể xóa</p>
              <button
                onClick={() => loadItems(activeTab)}
                className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#0066cc] hover:bg-[#005bb5] rounded-full active:scale-95 transition shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại dữ liệu</span>
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="animate-spin rounded-full h-9 w-9 border-4 border-[#0066cc] border-t-transparent mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Đang nạp danh sách dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select all bar */}
              <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/50 px-5 py-3.5 shadow-xs">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <CustomCheckbox
                    id="chk-select-all"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={toggleAll}
                  />
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
                    Chọn tất cả ({items.length} mục)
                  </span>
                </label>
                <span className="text-xs font-bold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
                  Đã chọn: {selectedItems.size}
                </span>
              </div>

              {/* Items List */}
              {activeTab === "images" ? (
                // Group images by assignment
                (() => {
                  const grouped = items.reduce((acc, item) => {
                    const key = item.assignmentId || "no-assignment";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                  }, {} as Record<string, CleanupItem[]>);

                  return Object.entries(grouped).map(([assignmentId, groupItems]) => {
                    const allSelected = groupItems.every((item) => selectedItems.has(item.id));

                    return (
                      <div key={assignmentId} className="mb-6 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-slate-900/20 p-5">
                        <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/5 mb-4">
                          <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                            <CustomCheckbox
                              id={`chk-grp-${assignmentId}`}
                              checked={allSelected}
                              onChange={() => toggleAssignmentGroup(groupItems)}
                            />
                            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#0066cc]" />
                              <span>{groupItems[0]?.assignmentTitle || "Hình ảnh bài tập"}</span>
                            </h3>
                          </label>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {groupItems.length} ảnh
                          </span>
                        </div>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3.5 p-4 rounded-[1.5rem] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                selectedItems.has(item.id)
                                  ? "border-[#0066cc]/40 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30"
                                  : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#252528] hover:border-[#0066cc]/30"
                              }`}
                            >
                              <CustomCheckbox
                                id={`chk-${item.id}`}
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(item.id)}
                              />
                              
                              <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 shadow-inner">
                                <img src={item.name} alt="Preview" className="w-full h-full object-cover" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                                  {item.name.split("/").pop()}
                                </p>
                                {item.info && (
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.info}</p>
                                )}
                              </div>
                              {item.size && (
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full shrink-0">
                                  {item.size}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                // Regular list for other tabs
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex items-center gap-3.5 p-4 rounded-[1.5rem] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        selectedItems.has(item.id)
                          ? "border-[#0066cc]/40 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30"
                          : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#252528] hover:border-[#0066cc]/30"
                      }`}
                    >
                      <CustomCheckbox
                        id={`chk-${item.id}`}
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                          {item.name}
                        </p>
                        {item.info && (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {item.info.split(" - ").map((part, index) => (
                              <span 
                                key={index} 
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  part.includes("Toán") ? "bg-blue-50 text-[#0066cc] dark:bg-blue-950/60 dark:text-blue-300" :
                                  part.includes("Lý") ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300" :
                                  part.includes("Văn") ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300" :
                                  part.includes("Anh") ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300" :
                                  part.includes("Sinh") ? "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300" :
                                  part.includes("Ẩn") ? "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300" :
                                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {part}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      {item.size && (
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full shrink-0">
                          {item.size}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 dark:border-white/5 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 rounded-b-[2.5rem]">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {selectedItems.size > 0
              ? `Đã chọn ${selectedItems.size} mục`
              : "Chưa chọn mục nào"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 rounded-full"
            >
              Đóng
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedItems.size === 0 || deleting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 active:scale-[0.98] rounded-full inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Đang xóa..." : `Xóa ${selectedItems.size > 0 ? `(${selectedItems.size})` : ""}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
