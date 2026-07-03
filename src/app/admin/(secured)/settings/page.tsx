"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Lock, Save, ShieldCheck, Trash2 } from "lucide-react";
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
        throw new Error(verifyData.error || "Không thể đăng ký passkey");
      }

      setPasskeyName("");
      setToast({ message: "Đăng ký vân tay thành công", type: "success" });
      await loadPasskeys();
    } catch (err: any) {
      setToast({ message: err.message || "Đăng ký vân tay thất bại", type: "error" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRevokePasskey = async (id: string) => {
    setPasskeyLoading(true);
    try {
      const res = await fetch(`/api/admin/passkeys/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể thu hồi passkey");
      }
      setToast({ message: "Đã thu hồi passkey", type: "success" });
      await loadPasskeys();
    } catch (err: any) {
      setToast({ message: err.message || "Không thể thu hồi passkey", type: "error" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Cài đặt hệ thống</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-2">Quản lý bảo mật, mật khẩu quản trị và cấu hình chung.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066cc]/10 text-[#0066cc]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Tính bảo mật</h2>
           </div>
           <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
             Bảo vệ tài khoản quản trị của bạn bằng cách sử dụng mật khẩu mạnh. Khuyến nghị thay đổi mật khẩu định kỳ 3 tháng một lần để đảm bảo an toàn.
           </p>
        </div>

        <div className="md:col-span-2">
           <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input 
                         type="password" 
                         required
                         value={currentPassword}
                         onChange={e => setCurrentPassword(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1d1d1f]/50 border border-slate-200 dark:border-white/10 rounded-2xl text-[15px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
                         placeholder="Nhập mật khẩu đang dùng"
                       />
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100 dark:border-white/5 grid gap-6">
                    <div>
                       <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">Mật khẩu mới</label>
                       <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            type="password" 
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1d1d1f]/50 border border-slate-200 dark:border-white/10 rounded-2xl text-[15px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
                            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">Xác nhận mật khẩu mới</label>
                       <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1d1d1f]/50 border border-slate-200 dark:border-white/10 rounded-2xl text-[15px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
                            placeholder="Nhập lại mật khẩu mới"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end pt-2">
                    <Button type="submit" variant="brand" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                       <Save className="h-4 w-4 mr-2" /> {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                    </Button>
                 </div>
              </form>
           </Card>

            <Card className="p-6 mt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Passkey (vân tay)</h3>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
                    Đăng ký thiết bị để đăng nhập nhanh bằng vân tay. Bạn có thể thu hồi thiết bị bất kỳ lúc nào.
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066cc]/10 text-[#0066cc]">
                  <Fingerprint className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">Tên thiết bị (tuỳ chọn)</label>
                  <input
                    type="text"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="VD: Xiaomi 13 của tôi"
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1d1d1f]/50 px-4 py-3 text-[15px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="brand" onClick={handleRegisterPasskey} disabled={passkeyLoading}>
                    <Fingerprint className="h-4 w-4 mr-2" /> {passkeyLoading ? "Đang xử lý..." : "Đăng ký vân tay"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-6">
                <h4 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">Thiết bị đã đăng ký</h4>
                {passkeyListLoading ? (
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-3">Đang tải danh sách...</p>
                ) : passkeys.length === 0 ? (
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-3">Chưa có thiết bị nào.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {passkeys.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1d1d1f]/50 px-4 py-4">
                        <div>
                          <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{item.name || "Thiết bị không tên"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đăng ký: {new Date(item.created_at).toLocaleString("vi-VN")}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRevokePasskey(item.id)}
                          disabled={passkeyLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Thu hồi</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </Card>
        </div>
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
