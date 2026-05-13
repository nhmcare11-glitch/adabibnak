"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { ScrollArea } from "./scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsBellProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export function NotificationsBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationsBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // تحديث الإشعارات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-semibold">الإشعارات</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notif.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    if (notif.link) {
                      window.location.href = notif.link;
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}