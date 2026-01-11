/**
 * OPERATIONS MODULE - PRIVACY-SAFE RELAY
 * 
 * Masked communication between parties without exposing personal information.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// RELAY TYPES
// ═══════════════════════════════════════════════════════════════════

export type RelayType = 
  | 'phone'       // Phone call relay
  | 'sms'         // SMS relay
  | 'email'       // Email relay
  | 'chat';       // In-app chat relay

export type RelayStatus = 
  | 'active'
  | 'expired'
  | 'suspended'
  | 'terminated';

export interface RelayChannel {
  id: string;
  caseId: string;
  type: RelayType;
  
  // Parties
  partyA: RelayParty;
  partyB: RelayParty;
  
  // Masked identifiers
  maskedIdentifiers: {
    partyA: MaskedIdentifier;
    partyB: MaskedIdentifier;
  };
  
  // Status
  status: RelayStatus;
  
  // Timing
  createdAt: string;
  expiresAt: string;
  lastActivityAt?: string;
  
  // Usage
  messageCount: number;
  callCount: number;
  
  // Moderation
  moderationEnabled: boolean;
  flaggedMessages: number;
  
  // Settings
  settings: RelaySettings;
  
  audit: AuditMetadata;
}

export interface RelayParty {
  userId: UserId;
  userType: 'owner' | 'finder' | 'volunteer' | 'moderator' | 'shelter';
  displayName: string; // Generic name shown to other party
  realContact: {
    phone?: string;
    email?: string;
  };
  consentGiven: boolean;
  consentAt?: string;
}

export interface MaskedIdentifier {
  maskedPhone?: string;    // e.g., "+1-555-RELAY-01"
  maskedEmail?: string;    // e.g., "case123-party1@relay.pet911.org"
  maskedChatId?: string;   // e.g., "chat_abc123"
}

export interface RelaySettings {
  // Time limits
  maxDurationHours: number;
  extendable: boolean;
  maxExtensions: number;
  
  // Message limits
  maxMessagesPerHour: number;
  maxMessagesTotal?: number;
  
  // Call limits
  maxCallDurationMinutes: number;
  maxCallsPerDay: number;
  
  // Content moderation
  autoModerateContent: boolean;
  blockKeywords: string[];
  flagKeywords: string[];
  
  // Privacy
  stripMetadata: boolean;
  logContent: boolean; // For audit/dispute resolution
  retentionDays: number;
  
  // Notifications
  notifyOnMessage: boolean;
  notifyOnMissedCall: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// RELAY MESSAGES
// ═══════════════════════════════════════════════════════════════════

export interface RelayMessage {
  id: string;
  channelId: string;
  
  // Sender/Receiver
  fromParty: 'A' | 'B';
  toParty: 'A' | 'B';
  fromUserId: UserId;
  toUserId: UserId;
  
  // Content
  type: 'text' | 'image' | 'document' | 'location' | 'system';
  content: string;
  contentHash?: string; // For audit without storing content
  
  // Attachments
  attachments?: RelayAttachment[];
  
  // Status
  status: 'pending' | 'delivered' | 'read' | 'failed' | 'blocked' | 'flagged';
  
  // Moderation
  moderated: boolean;
  moderationResult?: {
    blocked: boolean;
    flagged: boolean;
    reason?: string;
    matchedKeywords?: string[];
  };
  
  // Timing
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  
  audit: AuditMetadata;
}

export interface RelayAttachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  scanned: boolean;
  safe: boolean;
}

export interface RelayCall {
  id: string;
  channelId: string;
  
  // Parties
  initiatedBy: 'A' | 'B';
  fromUserId: UserId;
  toUserId: UserId;
  
  // Status
  status: 'ringing' | 'answered' | 'missed' | 'declined' | 'failed' | 'completed';
  
  // Timing
  initiatedAt: string;
  answeredAt?: string;
  endedAt?: string;
  duration?: number; // seconds
  
  // Recording (if enabled)
  recorded: boolean;
  recordingUrl?: string;
  recordingRetentionDays?: number;
  
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_RELAY_SETTINGS: RelaySettings = {
  maxDurationHours: 168, // 7 days
  extendable: true,
  maxExtensions: 2,
  maxMessagesPerHour: 20,
  maxMessagesTotal: 500,
  maxCallDurationMinutes: 30,
  maxCallsPerDay: 10,
  autoModerateContent: true,
  blockKeywords: [
    'ssn', 'social security',
    'bank account', 'routing number',
    'credit card', 'debit card',
    'venmo', 'cashapp', 'zelle', 'paypal',
    'wire transfer', 'western union',
  ],
  flagKeywords: [
    'meet alone', 'come alone',
    'cash only', 'wire money',
    'urgent payment', 'pay now',
    'address', 'home address',
    'social media', 'facebook', 'instagram',
  ],
  stripMetadata: true,
  logContent: true,
  retentionDays: 90,
  notifyOnMessage: true,
  notifyOnMissedCall: true,
};

// ═══════════════════════════════════════════════════════════════════
// RELAY MANAGER
// ═══════════════════════════════════════════════════════════════════

export class RelayManager {
  /**
   * Create relay channel
   */
  createChannel(params: {
    caseId: string;
    type: RelayType;
    partyA: Omit<RelayParty, 'consentGiven' | 'consentAt'>;
    partyB: Omit<RelayParty, 'consentGiven' | 'consentAt'>;
    settings?: Partial<RelaySettings>;
    createdBy: UserId;
  }): RelayChannel {
    const now = new Date().toISOString();
    const settings = { ...DEFAULT_RELAY_SETTINGS, ...params.settings };
    const expiresAt = new Date(Date.now() + settings.maxDurationHours * 60 * 60 * 1000);
    
    return {
      id: crypto.randomUUID(),
      caseId: params.caseId,
      type: params.type,
      partyA: {
        ...params.partyA,
        consentGiven: false,
      },
      partyB: {
        ...params.partyB,
        consentGiven: false,
      },
      maskedIdentifiers: {
        partyA: this.generateMaskedIdentifier(params.type, 'A'),
        partyB: this.generateMaskedIdentifier(params.type, 'B'),
      },
      status: 'active',
      createdAt: now,
      expiresAt: expiresAt.toISOString(),
      messageCount: 0,
      callCount: 0,
      moderationEnabled: settings.autoModerateContent,
      flaggedMessages: 0,
      settings,
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Record consent
   */
  recordConsent(
    channel: RelayChannel,
    party: 'A' | 'B',
    consent: boolean
  ): RelayChannel {
    const now = new Date().toISOString();
    
    const updatedChannel = {
      ...channel,
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
    
    if (party === 'A') {
      updatedChannel.partyA = {
        ...channel.partyA,
        consentGiven: consent,
        consentAt: consent ? now : undefined,
      };
    } else {
      updatedChannel.partyB = {
        ...channel.partyB,
        consentGiven: consent,
        consentAt: consent ? now : undefined,
      };
    }
    
    return updatedChannel;
  }
  
  /**
   * Send message through relay
   */
  sendMessage(
    channel: RelayChannel,
    fromParty: 'A' | 'B',
    content: string,
    type: RelayMessage['type'] = 'text',
    attachments?: RelayAttachment[]
  ): { message: RelayMessage; channel: RelayChannel } {
    const now = new Date().toISOString();
    
    // Validate channel is active
    if (channel.status !== 'active') {
      throw new Error('Channel is not active');
    }
    
    // Validate consent
    const sender = fromParty === 'A' ? channel.partyA : channel.partyB;
    const receiver = fromParty === 'A' ? channel.partyB : channel.partyA;
    
    if (!sender.consentGiven || !receiver.consentGiven) {
      throw new Error('Both parties must consent before messaging');
    }
    
    // Moderate content
    const moderationResult = this.moderateContent(content, channel.settings);
    
    // Create message
    const message: RelayMessage = {
      id: crypto.randomUUID(),
      channelId: channel.id,
      fromParty,
      toParty: fromParty === 'A' ? 'B' : 'A',
      fromUserId: sender.userId,
      toUserId: receiver.userId,
      type,
      content: moderationResult.blocked ? '[Content blocked]' : content,
      contentHash: this.hashContent(content),
      attachments,
      status: moderationResult.blocked ? 'blocked' : moderationResult.flagged ? 'flagged' : 'pending',
      moderated: true,
      moderationResult,
      sentAt: now,
      audit: {
        createdAt: now,
        createdBy: sender.userId,
        version: 1,
      },
    };
    
    // Update channel
    const updatedChannel = {
      ...channel,
      messageCount: channel.messageCount + 1,
      lastActivityAt: now,
      flaggedMessages: moderationResult.flagged ? channel.flaggedMessages + 1 : channel.flaggedMessages,
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
    
    return { message, channel: updatedChannel };
  }
  
  /**
   * Record call through relay
   */
  recordCall(
    channel: RelayChannel,
    initiatedBy: 'A' | 'B',
    status: RelayCall['status'],
    duration?: number
  ): { call: RelayCall; channel: RelayChannel } {
    const now = new Date().toISOString();
    
    const initiator = initiatedBy === 'A' ? channel.partyA : channel.partyB;
    const receiver = initiatedBy === 'A' ? channel.partyB : channel.partyA;
    
    const call: RelayCall = {
      id: crypto.randomUUID(),
      channelId: channel.id,
      initiatedBy,
      fromUserId: initiator.userId,
      toUserId: receiver.userId,
      status,
      initiatedAt: now,
      answeredAt: status === 'answered' || status === 'completed' ? now : undefined,
      endedAt: status === 'completed' || status === 'missed' || status === 'declined' ? now : undefined,
      duration,
      recorded: false,
      audit: {
        createdAt: now,
        createdBy: initiator.userId,
        version: 1,
      },
    };
    
    const updatedChannel = {
      ...channel,
      callCount: channel.callCount + 1,
      lastActivityAt: now,
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
    
    return { call, channel: updatedChannel };
  }
  
  /**
   * Extend channel expiration
   */
  extendChannel(
    channel: RelayChannel,
    additionalHours: number,
    extendedBy: UserId
  ): RelayChannel {
    const now = new Date().toISOString();
    
    // Check if extensions are available
    // Note: Would need to track extension count in production
    
    const newExpiry = new Date(new Date(channel.expiresAt).getTime() + additionalHours * 60 * 60 * 1000);
    
    return {
      ...channel,
      expiresAt: newExpiry.toISOString(),
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
  }
  
  /**
   * Suspend channel
   */
  suspendChannel(
    channel: RelayChannel,
    reason: string,
    suspendedBy: UserId
  ): RelayChannel {
    const now = new Date().toISOString();
    
    return {
      ...channel,
      status: 'suspended',
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
  }
  
  /**
   * Terminate channel
   */
  terminateChannel(
    channel: RelayChannel,
    reason: string,
    terminatedBy: UserId
  ): RelayChannel {
    const now = new Date().toISOString();
    
    return {
      ...channel,
      status: 'terminated',
      audit: {
        ...channel.audit,
        updatedAt: now,
        version: channel.audit.version + 1,
      },
    };
  }
  
  /**
   * Check if channel is expired
   */
  isExpired(channel: RelayChannel): boolean {
    return new Date(channel.expiresAt) <= new Date();
  }
  
  /**
   * Generate masked identifier
   */
  private generateMaskedIdentifier(type: RelayType, party: 'A' | 'B'): MaskedIdentifier {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    switch (type) {
      case 'phone':
        return {
          maskedPhone: `+1-555-${randomId.substring(0, 3)}-${randomId.substring(3, 6)}`,
        };
      case 'sms':
        return {
          maskedPhone: `+1-555-${randomId.substring(0, 3)}-${randomId.substring(3, 6)}`,
        };
      case 'email':
        return {
          maskedEmail: `relay-${randomId.toLowerCase()}@relay.pet911.org`,
        };
      case 'chat':
        return {
          maskedChatId: `chat_${randomId.toLowerCase()}`,
        };
    }
  }
  
  /**
   * Moderate content
   */
  private moderateContent(
    content: string,
    settings: RelaySettings
  ): { blocked: boolean; flagged: boolean; reason?: string; matchedKeywords?: string[] } {
    if (!settings.autoModerateContent) {
      return { blocked: false, flagged: false };
    }
    
    const contentLower = content.toLowerCase();
    const matchedKeywords: string[] = [];
    
    // Check block keywords
    for (const keyword of settings.blockKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        return {
          blocked: true,
          flagged: false,
          reason: 'Content contains blocked terms',
          matchedKeywords,
        };
      }
    }
    
    // Check flag keywords
    for (const keyword of settings.flagKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }
    
    if (matchedKeywords.length > 0) {
      return {
        blocked: false,
        flagged: true,
        reason: 'Content flagged for review',
        matchedKeywords,
      };
    }
    
    return { blocked: false, flagged: false };
  }
  
  /**
   * Hash content for audit
   */
  private hashContent(content: string): string {
    // Simplified hash - in production would use proper hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const relayManager = new RelayManager();

export function canSendMessage(channel: RelayChannel): boolean {
  if (channel.status !== 'active') return false;
  if (!channel.partyA.consentGiven || !channel.partyB.consentGiven) return false;
  if (relayManager.isExpired(channel)) return false;
  
  return true;
}

export function getRemainingTime(channel: RelayChannel): number {
  const now = Date.now();
  const expires = new Date(channel.expiresAt).getTime();
  
  return Math.max(0, Math.floor((expires - now) / (1000 * 60 * 60))); // hours
}

export function getChannelSummary(channel: RelayChannel): {
  id: string;
  status: RelayStatus;
  messageCount: number;
  callCount: number;
  flaggedMessages: number;
  remainingHours: number;
  bothPartiesConsented: boolean;
} {
  return {
    id: channel.id,
    status: channel.status,
    messageCount: channel.messageCount,
    callCount: channel.callCount,
    flaggedMessages: channel.flaggedMessages,
    remainingHours: getRemainingTime(channel),
    bothPartiesConsented: channel.partyA.consentGiven && channel.partyB.consentGiven,
  };
}

export function getMaskedContact(
  channel: RelayChannel,
  forParty: 'A' | 'B'
): MaskedIdentifier {
  // Return the OTHER party's masked identifier
  return forParty === 'A' ? channel.maskedIdentifiers.partyB : channel.maskedIdentifiers.partyA;
}

export function getConversationHistory(
  messages: RelayMessage[],
  channelId: string
): RelayMessage[] {
  return messages
    .filter(m => m.channelId === channelId)
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export function getFlaggedMessages(messages: RelayMessage[]): RelayMessage[] {
  return messages.filter(m => m.status === 'flagged');
}

export function getBlockedMessages(messages: RelayMessage[]): RelayMessage[] {
  return messages.filter(m => m.status === 'blocked');
}
