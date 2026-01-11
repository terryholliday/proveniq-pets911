'use client';

/**
 * ANTI_FRAUD_LOCKER_V2 Terminal Display
 * 
 * Visual representation of the fraud prevention system in action.
 * Displays real-time audit log entries in a terminal-style interface.
 */

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface AuditEntry {
  timestamp: string;
  eventType: 'INCOMING_MSG_BLOCKED' | 'AUDIT_LOG_ENTRY' | 'VERIFIED_MATCH' | 'USER_BAN';
  data: Record<string, string>;
}

interface AntiFraudTerminalProps {
  entries?: AuditEntry[];
  animated?: boolean;
}

const defaultEntries: AuditEntry[] = [
  {
    timestamp: '10:42:15',
    eventType: 'INCOMING_MSG_BLOCKED',
    data: {
      Reason: 'Suspicious Pattern Match (Cash Demand)',
      Action: 'USER_BAN + IP_BLACKLIST',
    },
  },
  {
    timestamp: '10:42:16',
    eventType: 'AUDIT_LOG_ENTRY',
    data: {
      Report: '#88219 preserved. Owner notified of blocked attempt.',
    },
  },
  {
    timestamp: '10:45:00',
    eventType: 'VERIFIED_MATCH',
    data: {
      Source: 'Shelter Partner (Kanawha)',
      Metadata: 'GPS_MATCH + CHIP_SCAN',
      Status: 'REUNITE_PENDING',
    },
  },
];

export function AntiFraudTerminal({ 
  entries = defaultEntries, 
  animated = true 
}: AntiFraudTerminalProps) {
  const [visibleEntries, setVisibleEntries] = useState<AuditEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!animated) {
      setVisibleEntries(entries);
      return;
    }

    if (currentIndex < entries.length) {
      const timer = setTimeout(() => {
        setVisibleEntries(prev => [...prev, entries[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, entries, animated]);

  const getEventColor = (eventType: AuditEntry['eventType']) => {
    switch (eventType) {
      case 'INCOMING_MSG_BLOCKED':
        return 'text-red-500';
      case 'VERIFIED_MATCH':
        return 'text-green-500';
      case 'USER_BAN':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getValueColor = (key: string, value: string) => {
    if (key === 'Reason' || key === 'Action') return 'text-red-400';
    if (key === 'Source') return 'text-green-400';
    if (key === 'Metadata') return 'text-cyan-400';
    if (key === 'Status') return 'text-yellow-400';
    return 'text-gray-300';
  };

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">○</span>
          <span className="text-gray-300">ANTI_FRAUD_LOCKER_V2</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 space-y-4 min-h-[280px]">
        {visibleEntries.map((entry, index) => (
          <div 
            key={index} 
            className={`space-y-1 ${animated ? 'animate-fadeIn' : ''}`}
          >
            {/* Timestamp and Event Type */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">[{entry.timestamp}]</span>
              <span className={getEventColor(entry.eventType)}>
                {entry.eventType}
              </span>
            </div>

            {/* Data Fields */}
            <div className="pl-4 space-y-0.5">
              {Object.entries(entry.data).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-gray-400">{key}:</span>
                  <span className={`ml-2 ${getValueColor(key, value)}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Cursor blink effect */}
        {animated && currentIndex >= entries.length && (
          <div className="flex items-center">
            <span className="text-gray-500">{'>'}</span>
            <span className="ml-1 w-2 h-4 bg-green-500 animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Protection Level Badge Component
 */
export function ProtectionLevelBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg">
      <span className="text-gray-500 text-xs uppercase tracking-wider">
        Protection Level
      </span>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950 border border-red-900 rounded">
        <Shield className="w-3.5 h-3.5 text-red-500" />
        <span className="text-red-400 text-xs font-semibold tracking-wide">
          MILITARY-GRADE
        </span>
      </div>
    </div>
  );
}

/**
 * Feature Card Component (for the left side of the screenshot)
 */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function AntiFraudFeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900/50 border border-gray-800">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default AntiFraudTerminal;
