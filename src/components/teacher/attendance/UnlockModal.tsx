"use client";

import { useState, useTransition } from "react";
import { FaLock, FaTimes, FaKey, FaExclamationTriangle } from "react-icons/fa";
import { verifyTeacherUnlockPassword } from "@/app/actions/teacher";

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export default function UnlockModal({ isOpen, onClose, onUnlockSuccess }: UnlockModalProps) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("กรุณากรอกรหัสผ่านเพื่อปลดล็อก");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await verifyTeacherUnlockPassword(password);
      if (res.success) {
        setPassword("");
        onUnlockSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "รหัสผ่านไม่ถูกต้อง");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
              <FaLock />
            </div>
            <div>
              <h3 className="font-bold text-base">ปลดล็อกการแก้ไขข้อมูล</h3>
              <p className="text-xs opacity-90 font-medium">ยืนยันรหัสผ่านเพื่อแก้ไขรายการเช็คชื่อ</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition text-white"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <FaExclamationTriangle className="shrink-0 text-base" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-700 block">
              รหัสผ่านบัญชีผู้ใช้ครู (หรือ PIN 1234)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FaKey />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านของคุณ..."
                autoFocus
                disabled={isPending}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              💡 ป้อนรหัสผ่านเข้าสู่ระบบของคุณครู หรือรหัสผ่านปลดล็อกมาตรฐาน (1234)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
            >
              {isPending ? "กำลังตรวจสอบ..." : "ยืนยันปลดล็อก"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
