"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Lock, Save, ShieldCheck, Trash2, Settings, KeyRound } from "lucide-react";
import Toast from "@/components/Toast";

type PasskeyDevice = {
  id: string;
  name: string | null;
  created_at: string;
};

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyListLoading, setPasskeyListLoading] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyDevice[]>([]);

  useEffect(() => {
    void loadPasskeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: "Mật khẩu xác nhận không khớp", type: "error" });
      return;
    }
    
    if (newPassword.length < 6) {
      setToast({ message: "Mật khẩu mới phải có ít nhất 6 ký tự", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể đổi mật khẩu");
      }
      
      setToast({ message: "Đổi mật khẩu thành công!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setToast({ message: err.message || "Có lỗi xảy ra", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadPasskeys = async () => {
    setPasskeyListLoading(true);
    try {
      const res = await fetch("/api/admin/passkeys");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải danh sách passkey");
      }
      setPasskeys(data.passkeys || []);
    } catch (err: any) {
      setToast({ message: err.message || "Không thể tải danh sách passkey", type: "error" });
    } finally {
      setPasskeyListLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    try {
      const optionsRes = await fetch("/api/admin/passkeys/register-options", { method: "POST" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(options.error || "Không thể tạo yêu cầu đăng ký");
      }

      const attestationResponse = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/admin/passkeys/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attestationResponse,
          name: passkeyName,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Xác minh passkey thất bại");
      }

      setToast({ message: "Đăng ký passkey thành công!", type: "success" });
      setPasskeyName("");
      await loadPasskeys();
    } catch (err: any) {
      setToast({ message: err.message || "Không thể đăng ký passkey", type: "error" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRevokePasskey = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn thu hồi thiết bị này không?")) return;
    setPasskeyLoading(true);
    try {
      const res = await fetch(`/api/admin/passkeys?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể thu hồi passkey");
      }

      setToast({ message: "Thu hồi thiết bị thành công!", type: "success" });
      await loadPasskeys();
    } catch (err: any) {
      setToast({ message: err.message || "Không thể thu hồi passkey", type: "error" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-16">
      {/* Header Tile Glassmorphic with Aura Glow */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/95 via-sky-50/50 to-blue-50/30 dark:from-[#18181b]/95 dark:via-[#18181b]/80 dark:to-blue-950/20 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,102,204,0.08)] p-6 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/15" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/10" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[#0066cc] dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Settings className="w-3.5 h-3.5" />
              <span>Cấu hình Hệ thống & Bảo mật Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-[-0.03em]">
              Cài đặt Hệ thống
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-xl">
              Quản lý mật khẩu quản trị viên, chứng thực thiết bị sinh trắc học Passkey và các thiết lập an toàn.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Sidebar Info Cards */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0066cc] to-sky-400 text-white shadow-lg shadow-blue-500/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Bảo mật Cấp cao</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khuyến nghị từ quản trị</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Bảo vệ bảng điều khiển quản trị bằng mật khẩu có độ phức tạp cao kết hợp tính năng đăng nhập không cần mật khẩu (Passkey TouchID/FaceID) giúp ngăn chặn rò rỉ thông tin tối đa.
            </p>
          </div>

          <div className="rounded-[2.25rem] bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.04] dark:from-emerald-500/10 dark:to-teal-500/5 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 shadow-[0_4px_24px_rgba(16,185,129,0.04)] p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Fingerprint className="w-4 h-4" />
              <span>Tiêu chuẩn FIDO2 / WebAuthn</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Passkey sử dụng khóa mã hóa bất đối xứng được lưu trực tiếp trên phần cứng của thiết bị (Secure Enclave / TPM), không chia sẻ mật khẩu qua mạng internet.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0066cc] dark:text-blue-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Đổi Mật khẩu Quản trị</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cập nhật mật khẩu truy cập hệ thống bảo mật Admin</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                    placeholder="Nhập mật khẩu đang dùng"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                      placeholder="Ít nhất 6 ký tự"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword} 
                  className="rounded-full bg-gradient-to-r from-[#0066cc] to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 px-7 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
                >
                  <Save className="h-4 w-4 mr-2" /> {loading ? "Đang lưu thay đổi..." : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </div>

          {/* Passkey Fingerprint Card */}
          <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Đăng nhập bằng Passkey</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đăng ký thiết bị để đăng nhập nhanh tức thì bằng TouchID / Windows Hello / FaceID.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Fingerprint className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Tên thiết bị (tùy chọn)</label>
                <input
                  type="text"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  placeholder="Ví dụ: MacBook Pro M2, Laptop Dell cá nhân..."
                  className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={handleRegisterPasskey} 
                  disabled={passkeyLoading} 
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-7 py-2.5 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98]"
                >
                  <Fingerprint className="h-4 w-4 mr-2" /> {passkeyLoading ? "Đang xử lý..." : "Đăng ký Passkey mới"}
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách Thiết bị đã liên kết</h4>
                <span className="text-[11px] font-semibold text-slate-400">{passkeys.length} thiết bị</span>
              </div>
              {passkeyListLoading ? (
                <div className="flex items-center justify-center p-6 text-xs text-slate-400">
                  <div className="animate-spin w-4 h-4 border-2 border-[#0066cc] border-t-transparent rounded-full mr-2" />
                  Đang tải danh sách thiết bị...
                </div>
              ) : passkeys.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <p className="text-xs text-slate-400 italic">Chưa có thiết bị nào được đăng ký passkey.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {passkeys.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 transition-all hover:border-slate-300 dark:hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name || "Thiết bị không tên"}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ngày tạo: {new Date(item.created_at).toLocaleString("vi-VN")}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokePasskey(item.id)}
                        disabled={passkeyLoading}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full text-xs font-semibold px-3"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Thu hồi</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
