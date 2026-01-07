'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { updateSightingReport, markNotificationsRead } from '@/lib/db/indexed-db';
import type { SightingNotification, SightingReportExtended } from '@/lib/types';

interface NotificationContextType {
  notifications: SightingNotification[];
  unreadCount: number;
  addNotification: (sightingId: string, notification: Omit<SightingNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (sightingId: string, notificationIds?: string[]) => Promise<void>;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<SightingNotification[]>([]);

  // Load sightings and their notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { getSightingReports } = await import('@/lib/db/indexed-db');
        const reports = await getSightingReports();

        // Flatten all notifications
        const allNotifications = reports.flatMap(report =>
          (report.notifications || []).map(notif => ({ ...notif, sightingId: report.id }))
        );

        // Sort by timestamp (newest first)
        allNotifications.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setNotifications(allNotifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  const addNotification = async (sightingId: string, notification: Omit<SightingNotification, 'id' | 'timestamp' | 'read'>) => {
    await updateSightingReport(sightingId, {}, notification);
    // Reload notifications
    const { getSightingReports } = await import('@/lib/db/indexed-db');
    const reports = await getSightingReports();
    const allNotifications = reports.flatMap(report =>
      (report.notifications || []).map(notif => ({ ...notif, sightingId: report.id }))
    );
    allNotifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setNotifications(allNotifications);
  };

  const markAsRead = async (sightingId: string, notificationIds?: string[]) => {
    await markNotificationsRead(sightingId, notificationIds);
    setNotifications(prev =>
      prev.map(notif =>
        (notif.sightingId === sightingId && (!notificationIds || notificationIds.includes(notif.id)))
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
