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

      const attestationResponse = await startRegistration(options);
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
      {/* Header Tile Glassmorphic */}
      <div className="rounded-[2rem] bg-gradient-to-br from-white via-[#f0f9ff]/60 to-[#e0f2fe]/40 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/40">
              <Settings className="w-3.5 h-3.5" />
              <span>Cấu hình Hệ thống & Bảo mật Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
              Cài đặt Hệ thống
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xl">
              Quản lý mật khẩu quản trị, phương thức đăng nhập bằng sinh trắc học và cấu hình an toàn.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Sidebar Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-400 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Bảo mật Tài khoản</h2>
                <p className="text-xs text-slate-500">Khuyến nghị từ hệ thống</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bảo vệ tài khoản quản trị của bạn bằng mật khẩu mạnh. Nên đổi mật khẩu định kỳ và kích hoạt đăng nhập Passkey để tối ưu tốc độ và an toàn.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0066cc]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đổi Mật khẩu Quản trị</h3>
                <p className="text-xs text-slate-500">Cập nhật mật khẩu truy cập hệ thống Admin</p>
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                    placeholder="Nhập mật khẩu đang dùng"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" variant="brand" disabled={loading || !currentPassword || !newPassword || !confirmPassword} className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20 px-6 py-2 text-xs font-semibold">
                  <Save className="h-4 w-4 mr-2" /> {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </div>

          {/* Passkey Fingerprint Card */}
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đăng nhập bằng Passkey</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đăng ký thiết bị để đăng nhập nhanh tức thì bằng TouchID / Fingerprint.
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <Fingerprint className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">Tên thiết bị (tùy chọn)</label>
                <input
                  type="text"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  placeholder="Ví dụ: Laptop Dell của tôi"
                  className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none"
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="brand" onClick={handleRegisterPasskey} disabled={passkeyLoading} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6">
                  <Fingerprint className="h-4 w-4 mr-2" /> {passkeyLoading ? "Đang xử lý..." : "Đăng ký passkey mới"}
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách Thiết bị Passkey</h4>
              {passkeyListLoading ? (
                <p className="text-xs text-slate-500 mt-3">Đang tải danh sách...</p>
              ) : passkeys.length === 0 ? (
                <p className="text-xs text-slate-400 italic mt-3">Chưa có thiết bị nào được đăng ký.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {passkeys.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1d1d1f]/50 p-3.5">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name || "Thiết bị không tên"}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Ngày đăng ký: {new Date(item.created_at).toLocaleString("vi-VN")}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokePasskey(item.id)}
                        disabled={passkeyLoading}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold"
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
