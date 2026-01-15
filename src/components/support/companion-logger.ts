/**
 * Companion Logger
 * Structured logging for Support Companion monitoring and analytics
 * 
 * All logs are structured JSON for easy parsing by monitoring systems.
 * Privacy-safe: No PII, means are redacted, only aggregate data.
 */

import type { PipelineOutput, HandoffPacket, RiskTier, ResponseMode } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface CompanionLogEntry {
  timestamp: string;
  sessionId: string;
  eventType: CompanionEventType;
  data: Record<string, unknown>;
}

export type CompanionEventType =
  | 'session_start'
  | 'message_processed'
  | 'crisis_detected'
  | 'crisis_confirmed'
  | 'crisis_denied'
  | 'mode_transition'
  | 'handoff_generated'
  | 'safety_exit'
  | 'grounding_shown'
  | 'hotline_displayed'
  | 'scam_warning_shown'
  | 'guard_triggered'
  | 'fact_extracted'
  | 'session_end';

export interface MessageProcessedData {
  tier: RiskTier;
  mode: ResponseMode;
  markerCount: number;
  topMarkers: string[];
  volatility: string;
  factsExtractedCount: number;
  guardsTriggered: string[];
  requiresModelCall: boolean;
  responseLength: number;
  processingTimeMs: number;
}

export interface CrisisDetectedData {
  tier: RiskTier;
  primaryCrisis: string | null;
  markerCount: number;
  isBystander: boolean;
  isCompound: boolean;
  cognitiveLoad: string;
}

export interface ModeTransitionData {
  previousMode: ResponseMode;
  newMode: ResponseMode;
  trigger: string;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class CompanionLogger {
  private sessionId: string;
  private sessionStart: Date;
  private messageCount: number = 0;
  private logs: CompanionLogEntry[] = [];
  private enabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
  }

  private generateSessionId(): string {
    return `companion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(eventType: CompanionEventType, data: Record<string, unknown>): void {
    if (!this.enabled) return;

    const entry: CompanionLogEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      eventType,
      data: {
        ...data,
        messageCount: this.messageCount,
        sessionDurationMs: Date.now() - this.sessionStart.getTime(),
      },
    };

    this.logs.push(entry);

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[COMPANION_LOG] ${eventType}:`, JSON.stringify(data, null, 2));
    }
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  sessionStart(): void {
    this.log('session_start', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  messageProcessed(output: PipelineOutput, processingTimeMs: number): void {
    this.messageCount++;

    const data: MessageProcessedData = {
      tier: output.tier,
      mode: output.mode,
      markerCount: output.markers.length,
      topMarkers: this.sanitizeMarkers(output.markers.slice(0, 5)),
      volatility: output.volatility,
      factsExtractedCount: Object.keys(output.factsExtractedThisTurn).length,
      guardsTriggered: output.guardsTriggered,
      requiresModelCall: output.requiresModelCall,
      responseLength: output.responseTemplate?.length || 0,
      processingTimeMs,
    };

    this.log('message_processed', data);

    // Also log crisis detection if applicable
    if (output.tier === 'CRITICAL' || output.tier === 'HIGH') {
      this.crisisDetected(output);
    }
  }

  crisisDetected(output: PipelineOutput): void {
    const data: CrisisDetectedData = {
      tier: output.tier,
      primaryCrisis: output.primaryCrisis,
      markerCount: output.markers.length,
      isBystander: output.isBystander,
      isCompound: output.markers.length > 2,
      cognitiveLoad: output.cognitiveLoad,
    };

    this.log('crisis_detected', data);
  }

  crisisConfirmed(tier: RiskTier): void {
    this.log('crisis_confirmed', { tier });
  }

  crisisDenied(): void {
    this.log('crisis_denied', {});
  }

  modeTransition(previousMode: ResponseMode, newMode: ResponseMode, trigger: string): void {
    const data: ModeTransitionData = {
      previousMode,
      newMode,
      trigger,
    };

    this.log('mode_transition', data);
  }

  handoffGenerated(packet: HandoffPacket): void {
    this.log('handoff_generated', {
      riskTier: packet.riskTier,
      markerCount: packet.markersDetected.length,
      mode: packet.mode,
      volatilityTrend: packet.volatilityTrend,
    });
  }

  safetyExit(trigger: 'keyboard' | 'button' | 'gesture' | 'command'): void {
    this.log('safety_exit', { trigger });
  }

  groundingShown(type: string): void {
    this.log('grounding_shown', { type });
  }

  hotlineDisplayed(type: string, region: string): void {
    this.log('hotline_displayed', { type, region });
  }

  scamWarningShown(): void {
    this.log('scam_warning_shown', {});
  }

  guardTriggered(guardName: string): void {
    this.log('guard_triggered', { guardName });
  }

  factExtracted(factType: string): void {
    this.log('fact_extracted', { factType });
  }

  sessionEnd(reason: 'user_close' | 'safety_exit' | 'timeout' | 'navigation'): void {
    this.log('session_end', {
      reason,
      totalMessages: this.messageCount,
      totalDurationMs: Date.now() - this.sessionStart.getTime(),
    });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  private sanitizeMarkers(markers: string[]): string[] {
    // Remove specific means from markers for privacy
    return markers.map(m => {
      if (m.includes('.means.')) {
        return m.split('.means.')[0] + '.means';
      }
      return m;
    });
  }

  getLogs(): CompanionLogEntry[] {
    return [...this.logs];
  }

  getSessionSummary(): Record<string, unknown> {
    const crisisEvents = this.logs.filter(l => l.eventType === 'crisis_detected');
    const modeTransitions = this.logs.filter(l => l.eventType === 'mode_transition');

    return {
      sessionId: this.sessionId,
      totalMessages: this.messageCount,
      durationMs: Date.now() - this.sessionStart.getTime(),
      crisisCount: crisisEvents.length,
      modeTransitionCount: modeTransitions.length,
      guardsTriggeredTotal: this.logs
        .filter(l => l.eventType === 'guard_triggered')
        .length,
    };
  }

  reset(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
    this.messageCount = 0;
    this.logs = [];
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const companionLogger = new CompanionLogger();

export default companionLogger;
