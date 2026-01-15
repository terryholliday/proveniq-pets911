'use client';

/**
 * Law Trigger Checkboxes Component
 * 
 * Displays checkboxes for reporting law-relevant concerns at intake.
 * When checked, triggers automatic ACO notification per WV statutes.
 */

import { useState } from 'react';

export type LawTriggerCategory =
  | 'APPEARS_HEALTHY'
  | 'MILDLY_INJURED'
  | 'APPEARS_MALNOURISHED'
  | 'ELDERLY_FRAIL'
  | 'PREGNANT_NURSING'
  | 'CRUELTY_SUSPECTED'
  | 'NEGLECT_SUSPECTED'
  | 'ABANDONMENT'
  | 'HOARDING_SITUATION'
  | 'INADEQUATE_SHELTER'
  | 'NO_FOOD_WATER'
  | 'MEDICAL_NEGLECT'
  | 'BITE_INCIDENT'
  | 'ATTACK_ON_HUMAN'
  | 'ATTACK_ON_ANIMAL'
  | 'AGGRESSIVE_BEHAVIOR'
  | 'VICIOUS_ANIMAL'
  | 'UNPROVOKED_AGGRESSION'
  | 'AT_LARGE_HAZARD'
  | 'PUBLIC_NUISANCE'
  | 'TRAFFIC_HAZARD'
  | 'PACK_BEHAVIOR'
  | 'REPEATED_ESCAPE'
  | 'INJURED_SEVERE'
  | 'INJURED_MODERATE'
  | 'SICK_CONTAGIOUS'
  | 'DECEASED_ANIMAL'
  | 'RABIES_EXPOSURE'
  | 'TETHERING_VIOLATION'
  | 'INADEQUATE_CONFINEMENT'
  | 'EXTREME_WEATHER_EXPOSURE'
  | 'ILLEGAL_BREEDING'
  | 'EXOTIC_ANIMAL'
  | 'LIVESTOCK_AT_LARGE'
  | 'WILDLIFE_CONFLICT'
  | 'OTHER_LAW_CONCERN';

// ACO = Animal Control Officer notification required per WV statute
// POLICE = Also notify law enforcement (crimes, attacks on humans)
// CRITICAL = Immediate/urgent response needed
const TRIGGER_GROUPS = {
  'Dangerous Behavior (ACO + Police)': [
    { id: 'BITE_INCIDENT', label: 'Bite incident occurred', aco: true, police: true, critical: true },
    { id: 'ATTACK_ON_HUMAN', label: 'Attack on human', aco: true, police: true, critical: true },
    { id: 'ATTACK_ON_ANIMAL', label: 'Attack on another animal', aco: true, police: true },
    { id: 'AGGRESSIVE_BEHAVIOR', label: 'Aggressive/threatening behavior', aco: true, police: true },
    { id: 'VICIOUS_ANIMAL', label: 'Vicious animal (known history)', aco: true, police: true, critical: true },
    { id: 'RABIES_EXPOSURE', label: 'Possible rabies exposure', aco: true, police: true, critical: true },
  ],
  'Suspected Cruelty/Neglect (ACO + Police)': [
    { id: 'CRUELTY_SUSPECTED', label: 'Suspected animal cruelty', aco: true, police: true },
    { id: 'NEGLECT_SUSPECTED', label: 'Suspected neglect', aco: true, police: true },
    { id: 'ABANDONMENT', label: 'Animal appears abandoned', aco: true, police: true },
    { id: 'NO_FOOD_WATER', label: 'No access to food/water', aco: true, police: true },
    { id: 'MEDICAL_NEGLECT', label: 'Untreated medical condition', aco: true, police: true },
    { id: 'HOARDING_SITUATION', label: 'Hoarding situation', aco: true, police: true },
    { id: 'APPEARS_MALNOURISHED', label: 'Appears malnourished/underweight', aco: true, police: true },
  ],
  'Public Safety (ACO + Police)': [
    { id: 'AT_LARGE_HAZARD', label: 'At-large creating hazard', aco: true, police: true },
    { id: 'TRAFFIC_HAZARD', label: 'Traffic hazard', aco: true, police: true },
    { id: 'PUBLIC_NUISANCE', label: 'Public nuisance', aco: true },
    { id: 'PACK_BEHAVIOR', label: 'Pack/group behavior', aco: true, police: true },
  ],
  'Housing & Tethering Violations (ACO)': [
    { id: 'TETHERING_VIOLATION', label: 'Improper tethering', aco: true },
    { id: 'INADEQUATE_SHELTER', label: 'Inadequate shelter/housing', aco: true },
    { id: 'INADEQUATE_CONFINEMENT', label: 'Inadequate confinement', aco: true },
    { id: 'EXTREME_WEATHER_EXPOSURE', label: 'Exposed to extreme weather', aco: true, police: true },
  ],
  'Other Reportable (ACO + Police)': [
    { id: 'EXOTIC_ANIMAL', label: 'Exotic/prohibited animal', aco: true, police: true },
    { id: 'LIVESTOCK_AT_LARGE', label: 'Livestock at large', aco: true, police: true },
    { id: 'WILDLIFE_CONFLICT', label: 'Wildlife conflict', aco: true, police: true },
    { id: 'ILLEGAL_BREEDING', label: 'Suspected illegal breeding', aco: true, police: true },
    { id: 'OTHER_LAW_CONCERN', label: 'Other legal concern', aco: true, police: true },
  ],
} as const;

interface LawTriggerCheckboxesProps {
  selectedTriggers: LawTriggerCategory[];
  onChange: (triggers: LawTriggerCategory[]) => void;
  compact?: boolean;
}

export function LawTriggerCheckboxes({
  selectedTriggers,
  onChange,
  compact = false,
}: LawTriggerCheckboxesProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    compact ? [] : Object.keys(TRIGGER_GROUPS)
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const toggleTrigger = (triggerId: LawTriggerCategory) => {
    if (selectedTriggers.includes(triggerId)) {
      onChange(selectedTriggers.filter((t) => t !== triggerId));
    } else {
      onChange([...selectedTriggers, triggerId]);
    }
  };

  const allItems = Object.values(TRIGGER_GROUPS).flat();
  const selectedItems = allItems.filter(item => selectedTriggers.includes(item.id as LawTriggerCategory));
  const hasCritical = selectedItems.some(item => 'critical' in item && item.critical);
  const hasPolice = selectedItems.some(item => 'police' in item && item.police);
  const hasAco = selectedItems.some(item => 'aco' in item && item.aco);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm font-medium text-zinc-300">
          Report Concerns (Optional)
        </label>
        {selectedTriggers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {hasCritical && (
              <span className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300">
                ⚠️ Critical
              </span>
            )}
            {hasPolice && (
              <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                🚔 Police notified
              </span>
            )}
            {hasAco && (
              <span className="text-xs px-2 py-1 rounded bg-amber-900/50 text-amber-300">
                📋 ACO notified
              </span>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        All items below trigger ACO notification per WV Code. Items marked with 🚔 also notify law enforcement.
      </p>

      <div className="border border-zinc-700 rounded-lg divide-y divide-zinc-700">
        {Object.entries(TRIGGER_GROUPS).map(([groupName, items]) => (
          <div key={groupName}>
            <button
              type="button"
              onClick={() => toggleGroup(groupName)}
              className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-zinc-200 hover:bg-zinc-800/50"
            >
              <span>{groupName}</span>
              <span className="text-zinc-500">
                {expandedGroups.includes(groupName) ? '−' : '+'}
              </span>
            </button>

            {expandedGroups.includes(groupName) && (
              <div className="px-3 pb-3 space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-zinc-800/50 ${
                      selectedTriggers.includes(item.id as LawTriggerCategory)
                        ? 'critical' in item && item.critical
                          ? 'bg-red-900/30'
                          : 'bg-amber-900/30'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTriggers.includes(item.id as LawTriggerCategory)}
                      onChange={() => toggleTrigger(item.id as LawTriggerCategory)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-zinc-200">
                      {item.label}
                      {'police' in item && item.police && (
                        <span className="ml-1 text-xs text-blue-400">🚔</span>
                      )}
                      {'critical' in item && item.critical && (
                        <span className="ml-1 text-xs text-red-400">(Critical)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTriggers.length > 0 && (
        <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <p className="text-xs text-amber-200">
            <strong>Legal Notice:</strong> By submitting this report with the selected concerns,
            Animal Control will be automatically notified per WV Code §7-1-14, §7-10-4, and/or §19-20-20.
            All notifications are logged for accountability.
          </p>
        </div>
      )}
    </div>
  );
}

export default LawTriggerCheckboxes;
