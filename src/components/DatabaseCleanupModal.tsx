"use client";

import { useState } from "react";

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
        className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-650 bg-white dark:bg-[#1a1c23] flex items-center justify-center cursor-pointer transition-all duration-200 peer-checked:bg-[#0066cc] peer-checked:border-[#0066cc] text-transparent peer-checked:text-white hover:scale-105 shadow-sm"
      >
        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </label>
    </div>
  );
}

export default function DatabaseCleanupModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"assignments" | "images" | "submissions" | "sessions" | "documents">("assignments");
  const [items, setItems] = useState<CleanupItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { key: "assignments" as const, label: "Bài tập", icon: "📝" },
    { key: "submissions" as const, label: "Bài nộp", icon: "✅" },
    { key: "sessions" as const, label: "Phiên", icon: "⏱️" },
    { key: "images" as const, label: "Hình ảnh", icon: "🖼️" },
    { key: "documents" as const, label: "Tài liệu", icon: "📚" },
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

  const handleTabChange = (tab: CleanupTabProps["type"]) => {
    setActiveTab(tab);
    loadItems(tab);
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
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const toggleAssignmentGroup = (groupItems: CleanupItem[]) => {
    const groupIds = groupItems.map((item) => item.id);
    const allSelected = groupIds.every((id) => selectedItems.has(id));

    const newSet = new Set(selectedItems);
    if (allSelected) {
      // Deselect all in group
      groupIds.forEach((id) => newSet.delete(id));
    } else {
      // Select all in group
      groupIds.forEach((id) => newSet.add(id));
    }
    setSelectedItems(newSet);
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      alert("Vui lòng chọn ít nhất một mục để xóa");
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
        alert("Xóa thành công!");
        loadItems(activeTab);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      alert("Có lỗi xảy ra khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 bg-white/95 dark:bg-[#151921] shadow-2xl flex flex-col transition-all">
        {/* Header */}
        <div className="relative z-20 overflow-hidden border-b border-slate-100 dark:border-white/5 px-6 py-5 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/20 to-indigo-50/30 dark:from-blue-950/20 dark:via-[#151921]/10 dark:to-indigo-950/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ef4444] text-white shadow-lg shadow-red-500/20">
                <span className="text-xl" aria-hidden="true">🗑️</span>
              </div>
              <div>
                <h2 className="text-[19px] font-bold text-slate-800 dark:text-white tracking-[-0.02em] leading-tight">Dọn dẹp Database</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Giải phóng dung lượng bằng cách xóa dữ liệu cũ không cần thiết</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 shadow-sm font-semibold"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs - iOS-style Segmented Control */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 shrink-0 bg-white/50 dark:bg-[#151921]/50 backdrop-blur-sm">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full overflow-x-auto no-scrollbar max-w-full">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-white dark:bg-[#1d1d1f] text-[#0066cc] dark:text-sky-400 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[15px]">{tab.icon}</span> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-0 flex-1 overflow-y-auto p-6" style={{ isolation: "isolate" }}>
          {!loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <span className="text-2xl" aria-hidden="true">📦</span>
              </div>
              <p className="text-[16px] font-bold text-slate-700 dark:text-slate-350">Không tìm thấy dữ liệu</p>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Không có mục nào cần dọn dẹp trong mục này</p>
              <button
                onClick={() => loadItems(activeTab)}
                className="mt-6 px-5 py-2.5 text-xs font-semibold text-white bg-[#0066cc] rounded-full hover:bg-blue-600 active:scale-95 transition shadow-md shadow-blue-500/20"
              >
                Tải lại dữ liệu
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0066cc] border-t-transparent mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select all */}
              <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 px-5 py-4 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <CustomCheckbox
                    id="chk-select-all"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={toggleAll}
                  />
                  <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                    Chọn tất cả ({items.length} mục)
                  </span>
                </label>
                <span className="text-xs font-semibold text-[#0066cc] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                  Đã chọn: {selectedItems.size}
                </span>
              </div>

              {/* Items list */}
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
                      <div key={assignmentId} className="mb-6 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/10 p-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                          <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                            <CustomCheckbox
                              id={`chk-grp-${assignmentId}`}
                              checked={allSelected}
                              onChange={() => toggleAssignmentGroup(groupItems)}
                            />
                            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span>📚</span> {groupItems[0]?.assignmentTitle || "Không có bài tập"}
                            </h3>
                          </label>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full">
                            {groupItems.length} ảnh
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3.5 p-4 rounded-[1.5rem] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                selectedItems.has(item.id)
                                  ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20"
                                  : "border-slate-100 bg-white dark:border-white/5 dark:bg-[#1a1c23] hover:border-slate-200 dark:hover:border-white/10"
                              }`}
                            >
                              <CustomCheckbox
                                id={`chk-${item.id}`}
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(item.id)}
                              />
                              
                              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 shadow-inner">
                                <img src={item.name} alt="Preview" className="w-full h-full object-cover" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate" title={item.name}>
                                  {item.name.split("/").pop()}
                                </p>
                                {item.info && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.info}</p>
                                )}
                              </div>
                              {item.size && (
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex items-center gap-3.5 p-4 rounded-[1.5rem] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        selectedItems.has(item.id)
                          ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20"
                          : "border-slate-100 bg-white dark:border-white/5 dark:bg-[#1a1c23] hover:border-slate-200 dark:hover:border-white/10"
                      }`}
                    >
                      <CustomCheckbox
                        id={`chk-${item.id}`}
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate" title={item.name}>
                          {item.name}
                        </p>
                        {item.info && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {item.info.split(" - ").map((part, index) => (
                              <span 
                                key={index} 
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                                  part.includes("Toán") ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                                  part.includes("Lý") ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" :
                                  part.includes("Hóa") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                  part.includes("Văn") ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                                  part.includes("Anh") ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                                  part.includes("Sinh") ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" :
                                  part.includes("Ẩn") ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
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
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full shrink-0">
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
        <div className="border-t border-slate-100 dark:border-white/5 bg-white/95 dark:bg-[#151921]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 rounded-b-[2.5rem]">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {selectedItems.size > 0
              ? `Đã chọn ${selectedItems.size} mục`
              : "Chưa chọn mục nào"}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 rounded-full shadow-sm"
            >
              Đóng
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedItems.size === 0 || deleting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#ef4444] rounded-full hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/10 active:scale-95"
            >
              {deleting ? "Đang xóa..." : `Xóa ${selectedItems.size > 0 ? `(${selectedItems.size})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
