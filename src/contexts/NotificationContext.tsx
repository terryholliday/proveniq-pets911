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
  const [sightings, setSightings] = useState<SightingReportExtended[]>([]);

  // Load sightings and their notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { getSightingReports } = await import('@/lib/db/indexed-db');
        const reports = await getSightingReports();
        setSightings(reports);
        
        // Flatten all notifications
        const allNotifications = reports.flatMap(report => 
          report.notifications.map(notif => ({ ...notif, sightingId: report.id }))
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
    
    // Set up periodic check for new notifications (every 30 seconds)
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate incoming notifications for active sightings
  useEffect(() => {
    const simulateNotifications = async () => {
      const activeSightings = sightings.filter(s => s.status === 'ACTIVE' && s.canStayWithAnimal);
      
      for (const sighting of activeSightings) {
        // Simulate random status updates
        if (Math.random() > 0.7) { // 30% chance each interval
          const messages = [
            { type: 'STATUS_UPDATE' as const, message: 'Your sighting has been received and is being reviewed.' },
            { type: 'ETA_UPDATE' as const, message: 'Rescue team estimated arrival: 15-20 minutes' },
            { type: 'SAFETY_GUIDE' as const, message: 'Safety tip: Keep a safe distance and avoid sudden movements.' },
          ];
          
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          
          await updateSightingReport(sighting.id, {}, randomMessage);
          
          // Reload notifications
          const { getSightingReports } = await import('@/lib/db/indexed-db');
          const reports = await getSightingReports();
          const allNotifications = reports.flatMap(report => 
            report.notifications.map(notif => ({ ...notif, sightingId: report.id }))
          );
          allNotifications.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setNotifications(allNotifications);
        }
      }
    };

    // Only simulate if we have active sightings
    if (activeSightings.length > 0) {
      const interval = setInterval(simulateNotifications, 45000); // Every 45 seconds
      return () => clearInterval(interval);
    }
  }, [sightings]);

  const addNotification = async (sightingId: string, notification: Omit<SightingNotification, 'id' | 'timestamp' | 'read'>) => {
    await updateSightingReport(sightingId, {}, notification);
    // Reload notifications
    const { getSightingReports } = await import('@/lib/db/indexed-db');
    const reports = await getSightingReports();
    const allNotifications = reports.flatMap(report => 
      report.notifications.map(notif => ({ ...notif, sightingId: report.id }))
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
