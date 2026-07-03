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
  type: "assignments" | "images" | "submissions" | "sessions";
}

export default function DatabaseCleanupModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"assignments" | "images" | "submissions" | "sessions">("assignments");
  const [items, setItems] = useState<CleanupItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { key: "assignments" as const, label: "Bài tập", icon: "📝" },
    { key: "submissions" as const, label: "Bài nộp", icon: "✅" },
    { key: "sessions" as const, label: "Phiên làm bài", icon: "⏱️" },
    { key: "images" as const, label: "Hình ảnh", icon: "🖼️" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl shadow-slate-300/40 flex flex-col">
        {/* Header */}
        <div className="relative z-20 overflow-hidden border-b border-white/70 px-6 py-5">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-50/70 via-white/40 to-indigo-50/60" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                <span aria-hidden="true">🗑️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Dọn dẹp Database</h2>
                <p className="text-xs text-slate-600">Xoa cac muc khong can thiet de giai phong dung luong</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-sm hover:bg-white hover:text-slate-700 transition"
              aria-label="Dong"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-30 border-b border-slate-200/80 px-4 py-2 flex gap-2 overflow-x-auto bg-white shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap ${activeTab === tab.key
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-0 flex-1 overflow-y-auto p-4 pt-6 sm:p-6" style={{ isolation: "isolate" }}>
          {!loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <span aria-hidden="true">📦</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">Chua co du lieu</p>
              <p className="mt-1 text-xs text-slate-500">Tai du lieu de bat dau don dep</p>
              <button
                onClick={() => loadItems(activeTab)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                Tai du lieu
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">Dang tai...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select all */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Chọn tất cả ({items.length} mục)
                  </span>
                </label>
                <span className="text-xs text-slate-600">
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
                      <div key={assignmentId} className="mb-4">
                        <div className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur border border-slate-200 rounded-2xl p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => toggleAssignmentGroup(groupItems)}
                                className="w-4 h-4"
                              />
                              <h3 className="text-sm font-bold text-slate-900">
                                📚 {groupItems[0]?.assignmentTitle || "Khong co bai tap"}
                              </h3>
                            </label>
                            <span className="text-xs text-slate-600">{groupItems.length} ảnh</span>
                          </div>
                        </div>
                        <div className="space-y-2 pl-4">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition ${selectedItems.has(item.id)
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(item.id)}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                {item.info && (
                                  <p className="text-xs text-slate-600">{item.info}</p>
                                )}
                              </div>
                              {item.size && (
                                <span className="text-xs text-slate-500">{item.size}</span>
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
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border transition ${selectedItems.has(item.id)
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    style={{ zIndex: 0 }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      {item.info && (
                        <p className="text-xs text-slate-600">{item.info}</p>
                      )}
                    </div>
                    {item.size && (
                      <span className="text-xs text-slate-500">{item.size}</span>
                    )}
                  </div>
                )))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/70 bg-white/80 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {selectedItems.size > 0
              ? `${selectedItems.size} mục được chọn`
              : "Chưa chọn mục nào"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedItems.size === 0 || deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Đang xóa..." : `Xóa ${selectedItems.size > 0 ? `(${selectedItems.size})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
