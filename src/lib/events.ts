"use client";

/**
 * ฟังก์ชันสำหรับส่งสัญญาณแจ้งทุกส่วนของระบบ (Topbar, Notifications Page, etc.) 
 * ให้ทำการรีเฟรชสถิติตัวเลขการแจ้งเตือนสดแบบ Real-time ข้ามแท็บและข้ามคอมโพเนนต์ทันที
 */
export function dispatchNotificationUpdate() {
  if (typeof window !== "undefined") {
    // 1. ส่ง CustomEvent ภายในแท็บเดียวกัน
    window.dispatchEvent(new CustomEvent("notifications-updated"));

    // 2. ส่ง BroadcastChannel ข้ามแท็บหน้าต่างเบราว์เซอร์
    try {
      const bc = new BroadcastChannel("lms-channel");
      bc.postMessage({ type: "NOTIFICATIONS_UPDATED" });
      bc.close();
    } catch (e) {
      console.error("BroadcastChannel error:", e);
    }
  }
}
