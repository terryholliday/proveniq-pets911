/**
 * OPERATIONS MODULE - NOTIFICATIONS
 * 
 * Routing, quiet hours, and notification preferences.
 */

import type { UserId, ContactMethod, DayOfWeek, Severity, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════

export type NotificationType = 
  | 'case_update'
  | 'match_found'
  | 'verification_required'
  | 'dispatch_assignment'
  | 'dispatch_update'
  | 'safety_alert'
  | 'escalation'
  | 'handoff'
  | 'system'
  | 'marketing';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export type NotificationStatus = 
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'cancelled'
  | 'suppressed';

export interface Notification {
  id: string;
  
  // Recipient
  recipientId: UserId;
  recipientType: 'user' | 'volunteer' | 'moderator' | 'admin';
  
  // Content
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  shortBody?: string;
  
  // Delivery
  channel: ContactMethod;
  deliveryAddress: string; // Email, phone, device token, etc.
  
  // Status
  status: NotificationStatus;
  
  // Timing
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  
  // Failure handling
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  
  // Context
  relatedEntityType?: 'case' | 'dispatch' | 'claim' | 'incident' | 'escalation';
  relatedEntityId?: string;
  actionUrl?: string;
  
  // Tracking
  trackingId?: string;
  externalId?: string; // Provider's message ID
  
  // Suppression
  suppressedReason?: 'quiet_hours' | 'opt_out' | 'rate_limit' | 'duplicate' | 'user_preference';
  
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════

export interface NotificationPreferences {
  userId: UserId;
  
  // Channel preferences
  channels: {
    email: ChannelPreference;
    sms: ChannelPreference;
    push: ChannelPreference;
    phone: ChannelPreference;
    inApp: ChannelPreference;
  };
  
  // Type preferences
  typePreferences: {
    type: NotificationType;
    enabled: boolean;
    channels: ContactMethod[];
    minPriority?: NotificationPriority;
  }[];
  
  // Quiet hours
  quietHours: QuietHoursConfig;
  
  // Batching
  batching: BatchingConfig;
  
  // Rate limiting
  rateLimits: RateLimitConfig;
  
  // Language
  preferredLanguage: string;
  timezone: string;
  
  // Global opt-out
  globalOptOut: boolean;
  globalOptOutAt?: string;
  
  lastUpdated: string;
  audit: AuditMetadata;
}

export interface ChannelPreference {
  enabled: boolean;
  address?: string; // Email, phone, etc.
  verified: boolean;
  verifiedAt?: string;
  priority: number; // Lower = preferred
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string; // "07:00"
  timezone: string;
  daysOfWeek: DayOfWeek[];
  
  // Override settings
  overrideForPriority: NotificationPriority[]; // Priorities that ignore quiet hours
  overrideForTypes: NotificationType[]; // Types that ignore quiet hours
}

export interface BatchingConfig {
  enabled: boolean;
  batchWindow: number; // minutes
  maxBatchSize: number;
  digestFrequency: 'immediate' | 'hourly' | 'twice_daily' | 'daily';
  digestTime?: string; // "09:00" for daily digest
  batchableTypes: NotificationType[];
}

export interface RateLimitConfig {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  maxPerWeek: number;
  cooldownMinutes: number;
  exemptTypes: NotificationType[];
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION ROUTING
// ═══════════════════════════════════════════════════════════════════

export interface NotificationRoute {
  type: NotificationType;
  priority: NotificationPriority;
  defaultChannels: ContactMethod[];
  fallbackChannels: ContactMethod[];
  requiresDeliveryConfirmation: boolean;
  maxDeliveryAttempts: number;
  retryDelayMinutes: number[];
  escalateOnFailure: boolean;
  escalateToRole?: string;
}

export const NOTIFICATION_ROUTES: NotificationRoute[] = [
  // Critical notifications
  {
    type: 'safety_alert',
    priority: 'critical',
    defaultChannels: ['push', 'sms', 'phone'],
    fallbackChannels: ['email'],
    requiresDeliveryConfirmation: true,
    maxDeliveryAttempts: 5,
    retryDelayMinutes: [1, 2, 5, 10, 15],
    escalateOnFailure: true,
    escalateToRole: 'lead_moderator',
  },
  {
    type: 'escalation',
    priority: 'critical',
    defaultChannels: ['push', 'sms'],
    fallbackChannels: ['phone', 'email'],
    requiresDeliveryConfirmation: true,
    maxDeliveryAttempts: 4,
    retryDelayMinutes: [1, 3, 5, 10],
    escalateOnFailure: true,
    escalateToRole: 'regional_coordinator',
  },
  
  // Urgent notifications
  {
    type: 'match_found',
    priority: 'urgent',
    defaultChannels: ['push', 'sms'],
    fallbackChannels: ['email'],
    requiresDeliveryConfirmation: false,
    maxDeliveryAttempts: 3,
    retryDelayMinutes: [5, 15, 30],
    escalateOnFailure: false,
  },
  {
    type: 'dispatch_assignment',
    priority: 'urgent',
    defaultChannels: ['push', 'sms'],
    fallbackChannels: ['email'],
    requiresDeliveryConfirmation: true,
    maxDeliveryAttempts: 3,
    retryDelayMinutes: [2, 5, 10],
    escalateOnFailure: true,
    escalateToRole: 'moderator',
  },
  
  // Normal notifications
  {
    type: 'case_update',
    priority: 'normal',
    defaultChannels: ['push', 'email'],
    fallbackChannels: ['sms'],
    requiresDeliveryConfirmation: false,
    maxDeliveryAttempts: 2,
    retryDelayMinutes: [30, 120],
    escalateOnFailure: false,
  },
  {
    type: 'verification_required',
    priority: 'normal',
    defaultChannels: ['email', 'push'],
    fallbackChannels: ['sms'],
    requiresDeliveryConfirmation: false,
    maxDeliveryAttempts: 3,
    retryDelayMinutes: [60, 240, 1440],
    escalateOnFailure: false,
  },
  {
    type: 'handoff',
    priority: 'normal',
    defaultChannels: ['push', 'email'],
    fallbackChannels: ['sms'],
    requiresDeliveryConfirmation: true,
    maxDeliveryAttempts: 3,
    retryDelayMinutes: [5, 15, 30],
    escalateOnFailure: true,
    escalateToRole: 'lead_moderator',
  },
  
  // Low priority notifications
  {
    type: 'system',
    priority: 'low',
    defaultChannels: ['email', 'in_app'],
    fallbackChannels: [],
    requiresDeliveryConfirmation: false,
    maxDeliveryAttempts: 1,
    retryDelayMinutes: [],
    escalateOnFailure: false,
  },
  {
    type: 'marketing',
    priority: 'low',
    defaultChannels: ['email'],
    fallbackChannels: [],
    requiresDeliveryConfirmation: false,
    maxDeliveryAttempts: 1,
    retryDelayMinutes: [],
    escalateOnFailure: false,
  },
];

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION MANAGER
// ═══════════════════════════════════════════════════════════════════

export class NotificationManager {
  /**
   * Create notification
   */
  createNotification(params: {
    recipientId: UserId;
    recipientType: Notification['recipientType'];
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    body: string;
    shortBody?: string;
    channel: ContactMethod;
    deliveryAddress: string;
    relatedEntityType?: Notification['relatedEntityType'];
    relatedEntityId?: string;
    actionUrl?: string;
    scheduledFor?: string;
    createdBy: UserId;
  }): Notification {
    const now = new Date().toISOString();
    const route = this.getRoute(params.type, params.priority);
    
    return {
      id: crypto.randomUUID(),
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      type: params.type,
      priority: params.priority,
      title: params.title,
      body: params.body,
      shortBody: params.shortBody,
      channel: params.channel,
      deliveryAddress: params.deliveryAddress,
      status: params.scheduledFor ? 'pending' : 'queued',
      createdAt: now,
      scheduledFor: params.scheduledFor,
      retryCount: 0,
      maxRetries: route?.maxDeliveryAttempts ?? 3,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      actionUrl: params.actionUrl,
      trackingId: crypto.randomUUID(),
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Check if notification should be sent
   */
  shouldSend(
    notification: Notification,
    preferences: NotificationPreferences
  ): { shouldSend: boolean; reason?: string } {
    // Check global opt-out
    if (preferences.globalOptOut) {
      return { shouldSend: false, reason: 'User has opted out of all notifications' };
    }
    
    // Check channel preference
    const channelPref = preferences.channels[notification.channel as keyof typeof preferences.channels];
    if (!channelPref?.enabled) {
      return { shouldSend: false, reason: `Channel ${notification.channel} is disabled` };
    }
    
    // Check type preference
    const typePref = preferences.typePreferences.find(t => t.type === notification.type);
    if (typePref && !typePref.enabled) {
      return { shouldSend: false, reason: `Notification type ${notification.type} is disabled` };
    }
    
    // Check quiet hours
    if (this.isInQuietHours(preferences.quietHours, notification.priority, notification.type)) {
      return { shouldSend: false, reason: 'Currently in quiet hours' };
    }
    
    // Check rate limits
    // Note: In production, this would check against actual notification history
    
    return { shouldSend: true };
  }
  
  /**
   * Get best channel for notification
   */
  getBestChannel(
    type: NotificationType,
    priority: NotificationPriority,
    preferences: NotificationPreferences
  ): ContactMethod | null {
    const route = this.getRoute(type, priority);
    if (!route) return null;
    
    // Get type-specific channel preferences
    const typePref = preferences.typePreferences.find(t => t.type === type);
    const preferredChannels = typePref?.channels ?? route.defaultChannels;
    
    // Find first available channel
    for (const channel of preferredChannels) {
      const channelPref = preferences.channels[channel as keyof typeof preferences.channels];
      if (channelPref?.enabled && channelPref.verified) {
        return channel;
      }
    }
    
    // Try fallback channels
    for (const channel of route.fallbackChannels) {
      const channelPref = preferences.channels[channel as keyof typeof preferences.channels];
      if (channelPref?.enabled && channelPref.verified) {
        return channel;
      }
    }
    
    return null;
  }
  
  /**
   * Mark notification as sent
   */
  markSent(notification: Notification, externalId?: string): Notification {
    const now = new Date().toISOString();
    
    return {
      ...notification,
      status: 'sent',
      sentAt: now,
      externalId,
      audit: {
        ...notification.audit,
        updatedAt: now,
        version: notification.audit.version + 1,
      },
    };
  }
  
  /**
   * Mark notification as delivered
   */
  markDelivered(notification: Notification): Notification {
    const now = new Date().toISOString();
    
    return {
      ...notification,
      status: 'delivered',
      deliveredAt: now,
      audit: {
        ...notification.audit,
        updatedAt: now,
        version: notification.audit.version + 1,
      },
    };
  }
  
  /**
   * Mark notification as read
   */
  markRead(notification: Notification): Notification {
    const now = new Date().toISOString();
    
    return {
      ...notification,
      status: 'read',
      readAt: now,
      audit: {
        ...notification.audit,
        updatedAt: now,
        version: notification.audit.version + 1,
      },
    };
  }
  
  /**
   * Mark notification as failed
   */
  markFailed(notification: Notification, reason: string): Notification {
    const now = new Date().toISOString();
    const route = this.getRoute(notification.type, notification.priority);
    
    const newRetryCount = notification.retryCount + 1;
    const shouldRetry = newRetryCount < notification.maxRetries;
    
    // Calculate next retry time
    let nextRetryAt: string | undefined;
    if (shouldRetry && route?.retryDelayMinutes[newRetryCount - 1]) {
      const retryDelay = route.retryDelayMinutes[newRetryCount - 1];
      nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000).toISOString();
    }
    
    return {
      ...notification,
      status: shouldRetry ? 'pending' : 'failed',
      failedAt: now,
      failureReason: reason,
      retryCount: newRetryCount,
      nextRetryAt,
      audit: {
        ...notification.audit,
        updatedAt: now,
        version: notification.audit.version + 1,
      },
    };
  }
  
  /**
   * Suppress notification
   */
  suppress(
    notification: Notification,
    reason: Notification['suppressedReason']
  ): Notification {
    const now = new Date().toISOString();
    
    return {
      ...notification,
      status: 'suppressed',
      suppressedReason: reason,
      audit: {
        ...notification.audit,
        updatedAt: now,
        version: notification.audit.version + 1,
      },
    };
  }
  
  /**
   * Check if in quiet hours
   */
  isInQuietHours(
    config: QuietHoursConfig,
    priority: NotificationPriority,
    type: NotificationType
  ): boolean {
    if (!config.enabled) return false;
    
    // Check priority override
    if (config.overrideForPriority.includes(priority)) {
      return false;
    }
    
    // Check type override
    if (config.overrideForTypes.includes(type)) {
      return false;
    }
    
    // Check current time
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      timeZone: config.timezone 
    }).toLowerCase() as DayOfWeek;
    
    // Check if current day is in quiet hours
    if (!config.daysOfWeek.includes(currentDay)) {
      return false;
    }
    
    // Check time
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: config.timezone,
    });
    
    const startTime = config.startTime;
    const endTime = config.endTime;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    } else {
      return currentTime >= startTime && currentTime < endTime;
    }
  }
  
  /**
   * Get notification route
   */
  getRoute(type: NotificationType, priority: NotificationPriority): NotificationRoute | undefined {
    return NOTIFICATION_ROUTES.find(r => r.type === type && r.priority === priority) ??
           NOTIFICATION_ROUTES.find(r => r.type === type);
  }
  
  /**
   * Get notification statistics
   */
  getStatistics(notifications: Notification[]): {
    total: number;
    byStatus: Record<NotificationStatus, number>;
    byChannel: Record<ContactMethod, number>;
    byType: Record<NotificationType, number>;
    deliveryRate: number;
    readRate: number;
    failureRate: number;
  } {
    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    for (const notification of notifications) {
      byStatus[notification.status] = (byStatus[notification.status] ?? 0) + 1;
      byChannel[notification.channel] = (byChannel[notification.channel] ?? 0) + 1;
      byType[notification.type] = (byType[notification.type] ?? 0) + 1;
    }
    
    const total = notifications.length;
    const delivered = (byStatus['delivered'] ?? 0) + (byStatus['read'] ?? 0);
    const read = byStatus['read'] ?? 0;
    const failed = byStatus['failed'] ?? 0;
    
    return {
      total,
      byStatus: byStatus as Record<NotificationStatus, number>,
      byChannel: byChannel as Record<ContactMethod, number>,
      byType: byType as Record<NotificationType, number>,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const notificationManager = new NotificationManager();

export function createDefaultPreferences(userId: UserId): NotificationPreferences {
  const now = new Date().toISOString();
  
  return {
    userId,
    channels: {
      email: { enabled: true, verified: false, priority: 2 },
      sms: { enabled: false, verified: false, priority: 3 },
      push: { enabled: true, verified: false, priority: 1 },
      phone: { enabled: false, verified: false, priority: 4 },
      inApp: { enabled: true, verified: true, priority: 1 },
    },
    typePreferences: [
      { type: 'case_update', enabled: true, channels: ['push', 'email'] },
      { type: 'match_found', enabled: true, channels: ['push', 'sms', 'email'] },
      { type: 'verification_required', enabled: true, channels: ['email', 'push'] },
      { type: 'dispatch_assignment', enabled: true, channels: ['push', 'sms'] },
      { type: 'dispatch_update', enabled: true, channels: ['push'] },
      { type: 'safety_alert', enabled: true, channels: ['push', 'sms', 'phone'] },
      { type: 'escalation', enabled: true, channels: ['push', 'sms'] },
      { type: 'handoff', enabled: true, channels: ['push', 'email'] },
      { type: 'system', enabled: true, channels: ['email', 'in_app'] },
      { type: 'marketing', enabled: false, channels: ['email'] },
    ],
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      timezone: 'America/New_York',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      overrideForPriority: ['critical', 'urgent'],
      overrideForTypes: ['safety_alert', 'escalation'],
    },
    batching: {
      enabled: true,
      batchWindow: 15,
      maxBatchSize: 10,
      digestFrequency: 'daily',
      digestTime: '09:00',
      batchableTypes: ['case_update', 'system'],
    },
    rateLimits: {
      enabled: true,
      maxPerHour: 20,
      maxPerDay: 50,
      maxPerWeek: 200,
      cooldownMinutes: 5,
      exemptTypes: ['safety_alert', 'escalation', 'verification_required'],
    },
    preferredLanguage: 'en',
    timezone: 'America/New_York',
    globalOptOut: false,
    lastUpdated: now,
    audit: {
      createdAt: now,
      createdBy: userId,
      version: 1,
    },
  };
}

export function shouldBatch(
  notification: Notification,
  preferences: NotificationPreferences
): boolean {
  if (!preferences.batching.enabled) return false;
  
  return preferences.batching.batchableTypes.includes(notification.type);
}

export function getPriorityScore(priority: NotificationPriority): number {
  switch (priority) {
    case 'critical': return 100;
    case 'urgent': return 80;
    case 'high': return 60;
    case 'normal': return 40;
    case 'low': return 20;
  }
}

export function sortByPriority(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => 
    getPriorityScore(b.priority) - getPriorityScore(a.priority)
  );
}

export function filterPendingRetries(notifications: Notification[]): Notification[] {
  const now = Date.now();
  
  return notifications.filter(n => 
    n.status === 'pending' &&
    n.nextRetryAt &&
    new Date(n.nextRetryAt).getTime() <= now
  );
}

export function needsEscalation(notification: Notification): boolean {
  if (notification.status !== 'failed') return false;
  
  const route = notificationManager.getRoute(notification.type, notification.priority);
  return route?.escalateOnFailure ?? false;
}
