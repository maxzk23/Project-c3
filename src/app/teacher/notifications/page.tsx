"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  getNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  deleteNotification,
  clearAllNotifications,
  getAssignmentClassId
} from "@/app/actions/notification";
import { dispatchNotificationUpdate } from "@/lib/events";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { 
  FaBell, 
  FaBookOpen, 
  FaFileAlt, 
  FaTrophy, 
  FaExclamationCircle,
  FaCheck,
  FaTrash,
  FaBellSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";

interface NotificationItem {
  id: string;
  recipientId: string;
  type: string; // INFO, WARNING, SUCCESS, ALERT
  title: string;
  message: string;
  relatedType: string | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export default function TeacherNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const loadNotifications = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    const data = await getNotifications();
    setNotifications(data as any[]);
    if (!isSilent) setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications(false);

    const handleNotifyUpdate = () => {
      loadNotifications(true);
    };

    window.addEventListener("notifications-updated", handleNotifyUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lms-channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "NOTIFICATIONS_UPDATED") {
          loadNotifications(true);
        }
      };
    } catch (e) {}

    // ดึงข้อมูลการแจ้งเตือนใหม่ๆ ทุกๆ 8 วินาทีแบบเงียบๆ
    const interval = setInterval(async () => {
      loadNotifications(true);
    }, 8000);

    return () => {
      window.removeEventListener("notifications-updated", handleNotifyUpdate);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        dispatchNotificationUpdate();
      }
    });
  };

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        dispatchNotificationUpdate();
      }
    });
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      dispatchNotificationUpdate();
    }

    if (item.relatedType === "ASSIGNMENT" && item.relatedId) {
      const classId = await getAssignmentClassId(item.relatedId);
      if (classId) {
        localStorage.setItem("teacher-grading-classId", classId);
        localStorage.setItem("teacher-grading-expandedIds", JSON.stringify([item.relatedId]));
        
        try {
          const savedTabs = localStorage.getItem("teacher-grading-activeTabs");
          let tabs = savedTabs ? JSON.parse(savedTabs) : {};
          tabs[item.relatedId] = "pending";
          localStorage.setItem("teacher-grading-activeTabs", JSON.stringify(tabs));
        } catch (e) {
          console.error("Failed to set activeTab in storage", e);
        }
      }
      
      if (window.location.pathname === "/teacher/grading") {
        window.location.reload();
      } else {
        router.push("/teacher/grading");
      }
    } else if (item.relatedType === "LESSON") {
      router.push("/teacher/materials");
    }
  };

  const [deleteSingleId, setDeleteSingleId] = useState<string | null>(null);

  const handleConfirmDeleteSingle = () => {
    if (!deleteSingleId) return;
    startTransition(async () => {
      const res = await deleteNotification(deleteSingleId);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n.id !== deleteSingleId));
        dispatchNotificationUpdate();
      }
      setDeleteSingleId(null);
    });
  };

  const handleConfirmClearAll = () => {
    startTransition(async () => {
      const res = await clearAllNotifications();
      if (res.success) {
        setNotifications([]);
        dispatchNotificationUpdate();
      }
    });
  };

  const getIcon = (type: string, relatedType: string | null) => {
    if (relatedType === "LESSON") {
      return <FaBookOpen className="text-purple-500" />;
    }
    if (relatedType === "ASSIGNMENT") {
      return <FaFileAlt className="text-orange-500" />;
    }
    
    switch (type) {
      case "SUCCESS":
        return <FaCheckCircle className="text-emerald-500" />;
      case "WARNING":
        return <FaExclamationTriangle className="text-amber-500" />;
      case "ALERT":
        return <FaExclamationCircle className="text-rose-500" />;
      default:
        return <FaInfoCircle className="text-sky-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " น.";
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FaBell className="text-sky-600" /> การแจ้งเตือนทั้งหมด
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500 text-white rounded-full ml-1">
                {unreadCount} ใหม่
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">ติดตามเหตุการณ์การส่งงานของนักเรียน มินิเกมของชั้นเรียน และการตั้งค่าของระบบ</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAllRead}
                disabled={isPending || unreadCount === 0}
                className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition shadow-sm border border-sky-100 disabled:opacity-50"
              >
                ทำเครื่องหมายอ่านแล้วทั้งหมด
              </button>
              <button
                onClick={() => setIsClearModalOpen(true)}
                disabled={isPending}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition shadow-sm border border-rose-100 cursor-pointer"
              >
                ล้างแจ้งเตือนทั้งหมด
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลแจ้งเตือน...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
              <FaBellSlash className="text-2xl text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">ไม่มีการแจ้งเตือน</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">เมื่อนักเรียนส่งการบ้านหรือทำกิจกรรม จะแจ้งเตือนคุณครูผ่านเมนูนี้ครับ</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 -mx-6 -my-6">
            {notifications.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleNotificationClick(item)}
                className={`flex gap-4 p-5 hover:bg-slate-50/80 transition relative cursor-pointer select-none group border-l-4 ${
                  !item.isRead ? "bg-sky-50/20 border-l-sky-600 font-medium" : "border-l-transparent"
                }`}
              >
                {/* Icon Container */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base shadow-sm border ${
                  !item.isRead ? "bg-white border-sky-100" : "bg-slate-50 border-slate-100"
                }`}>
                  {getIcon(item.type, item.relatedType)}
                </div>

                {/* Content body */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className={`text-slate-800 text-xs truncate ${!item.isRead ? "font-bold" : "font-semibold"}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold pr-8">
                    {item.message}
                  </p>
                </div>

                {/* Delete button (displays on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteSingleId(item.id);
                  }}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 absolute right-4 bottom-5 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="ลบแจ้งเตือนนี้"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal สำหรับลบการแจ้งเตือนรายการเดียว */}
      <ConfirmModal
        isOpen={!!deleteSingleId}
        onClose={() => setDeleteSingleId(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="ยืนยันการลบการแจ้งเตือน?"
        description="การลบรายการนี้จะเป็นการลบข้อความแจ้งเตือนออกจากระบบอย่างถาวร และจะไม่สามารถเรียกคืนข้อมูลได้อีกต่อไป"
        confirmText="ลบอย่างถาวร"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={isPending}
      />

      {/* Confirm Modal สำหรับล้างแจ้งเตือนทั้งหมด */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="ยืนยันการล้างประวัติการแจ้งเตือน?"
        description="คุณต้องการลบประวัติรายการแจ้งเตือนทั้งหมดใช่หรือไม่? ข้อมูลประวัติการแจ้งเตือนที่ลบไปแล้วจะไม่สามารถกู้คืนกลับมาได้"
        confirmText="ลบอย่างถาวร"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={isPending}
      />

    </div>
  );
}
