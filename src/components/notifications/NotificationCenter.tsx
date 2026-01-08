'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, X, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import type { SightingNotification } from '@/lib/types';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-hide notification dropdown after 10 seconds of inactivity
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const getNotificationIcon = (type: SightingNotification['type']) => {
    switch (type) {
      case 'STATUS_UPDATE':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'ETA_UPDATE':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'RESOLVER_ARRIVAL':
        return <User className="w-5 h-5 text-green-500" />;
      case 'SAFETY_GUIDE':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Clear All
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you of updates to your sightings</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-slate-700/30' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read && notification.sightingId) {
                        markAsRead(notification.sightingId, [notification.id]);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
