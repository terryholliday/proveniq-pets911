'use client';

/**
 * Law Trigger Checkboxes Component
 * 
 * Displays checkboxes for reporting law-relevant concerns at intake.
 * When checked, triggers automatic ACO notification per WV statutes.
 */

import { useState } from 'react';

export type LawTriggerCategory =
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

const TRIGGER_GROUPS = {
  'Animal Condition': [
    { id: 'INJURED_SEVERE', label: 'Severely injured (life-threatening)', critical: true },
    { id: 'INJURED_MODERATE', label: 'Moderately injured' },
    { id: 'SICK_CONTAGIOUS', label: 'Appears sick/contagious', critical: true },
    { id: 'DECEASED_ANIMAL', label: 'Deceased animal' },
    { id: 'RABIES_EXPOSURE', label: 'Possible rabies exposure', critical: true },
  ],
  'Dangerous Behavior': [
    { id: 'BITE_INCIDENT', label: 'Bite incident occurred', critical: true },
    { id: 'ATTACK_ON_HUMAN', label: 'Attack on human', critical: true },
    { id: 'ATTACK_ON_ANIMAL', label: 'Attack on another animal' },
    { id: 'AGGRESSIVE_BEHAVIOR', label: 'Aggressive/threatening behavior' },
    { id: 'VICIOUS_ANIMAL', label: 'Vicious animal', critical: true },
  ],
  'Cruelty & Neglect': [
    { id: 'CRUELTY_SUSPECTED', label: 'Suspected animal cruelty' },
    { id: 'NEGLECT_SUSPECTED', label: 'Suspected neglect' },
    { id: 'ABANDONMENT', label: 'Animal appears abandoned' },
    { id: 'NO_FOOD_WATER', label: 'No access to food/water' },
    { id: 'MEDICAL_NEGLECT', label: 'Untreated medical condition' },
    { id: 'HOARDING_SITUATION', label: 'Hoarding situation' },
  ],
  'Public Safety': [
    { id: 'AT_LARGE_HAZARD', label: 'At-large creating hazard' },
    { id: 'TRAFFIC_HAZARD', label: 'Traffic hazard' },
    { id: 'PUBLIC_NUISANCE', label: 'Public nuisance' },
    { id: 'PACK_BEHAVIOR', label: 'Pack/group behavior' },
  ],
  'Housing & Tethering': [
    { id: 'TETHERING_VIOLATION', label: 'Improper tethering' },
    { id: 'INADEQUATE_SHELTER', label: 'Inadequate shelter/housing' },
    { id: 'INADEQUATE_CONFINEMENT', label: 'Inadequate confinement' },
    { id: 'EXTREME_WEATHER_EXPOSURE', label: 'Exposed to extreme weather' },
  ],
  'Other': [
    { id: 'EXOTIC_ANIMAL', label: 'Exotic/prohibited animal' },
    { id: 'LIVESTOCK_AT_LARGE', label: 'Livestock at large' },
    { id: 'WILDLIFE_CONFLICT', label: 'Wildlife conflict' },
    { id: 'ILLEGAL_BREEDING', label: 'Suspected illegal breeding' },
    { id: 'OTHER_LAW_CONCERN', label: 'Other legal concern' },
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

  const hasCritical = selectedTriggers.some((t) =>
    Object.values(TRIGGER_GROUPS)
      .flat()
      .find((item) => item.id === t && 'critical' in item && item.critical)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Report Concerns (Optional)
        </label>
        {selectedTriggers.length > 0 && (
          <span className={`text-xs px-2 py-1 rounded ${
            hasCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {hasCritical ? '⚠️ Critical - ACO will be notified immediately' : `${selectedTriggers.length} concern(s) selected`}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Selecting any concerns below will automatically notify Animal Control per WV law.
      </p>

      <div className="border rounded-lg divide-y">
        {Object.entries(TRIGGER_GROUPS).map(([groupName, items]) => (
          <div key={groupName}>
            <button
              type="button"
              onClick={() => toggleGroup(groupName)}
              className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>{groupName}</span>
              <span className="text-gray-400">
                {expandedGroups.includes(groupName) ? '−' : '+'}
              </span>
            </button>

            {expandedGroups.includes(groupName) && (
              <div className="px-3 pb-3 space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 ${
                      selectedTriggers.includes(item.id as LawTriggerCategory)
                        ? 'critical' in item && item.critical
                          ? 'bg-red-50'
                          : 'bg-amber-50'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTriggers.includes(item.id as LawTriggerCategory)}
                      onChange={() => toggleTrigger(item.id as LawTriggerCategory)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">
                      {item.label}
                      {'critical' in item && item.critical && (
                        <span className="ml-1 text-xs text-red-600">(Critical)</span>
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
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
