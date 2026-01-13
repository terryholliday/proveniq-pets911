'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  Home, 
  Users, 
  Truck, 
  Cat,
  ArrowRight,
  Phone,
  CheckCircle
} from 'lucide-react';

interface CapacityCrisisWorkflowProps {
  caseId: string;
  caseNumber: string;
  animalDescription: string;
  county: string;
  shelterName?: string;
  refusalReason?: string;
  onOptionSelected: (option: string, notes?: string) => void;
}

const OPTIONS = [
  {
    id: 'FOSTER_APPEAL',
    label: 'Create Foster Appeal',
    description: 'Broadcast to certified foster homes in the area',
    icon: Home,
    color: 'bg-blue-900/30 border-blue-700 hover:bg-blue-900/50',
    iconColor: 'text-blue-400',
  },
  {
    id: 'RESCUE_PARTNER',
    label: 'Find Rescue Partner',
    description: 'Alert partner rescues who may have capacity',
    icon: Users,
    color: 'bg-purple-900/30 border-purple-700 hover:bg-purple-900/50',
    iconColor: 'text-purple-400',
  },
  {
    id: 'COMMUNITY_CAT',
    label: 'Community Cat Program',
    description: 'For feral/community cats: TNR and return',
    icon: Cat,
    color: 'bg-green-900/30 border-green-700 hover:bg-green-900/50',
    iconColor: 'text-green-400',
  },
  {
    id: 'TRANSPORT_OUT',
    label: 'Transport to Partner',
    description: 'Coordinate transport to shelter with capacity',
    icon: Truck,
    color: 'bg-amber-900/30 border-amber-700 hover:bg-amber-900/50',
    iconColor: 'text-amber-400',
  },
];

export function CapacityCrisisWorkflow({
  caseId,
  caseNumber,
  animalDescription,
  county,
  shelterName,
  refusalReason,
  onOptionSelected,
}: CapacityCrisisWorkflowProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    setSubmitting(true);
    try {
      await onOptionSelected(selectedOption, notes);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">Action Initiated</h3>
        <p className="text-zinc-400 text-sm">
          {selectedOption === 'FOSTER_APPEAL' && 'Foster appeal has been broadcast to certified homes.'}
          {selectedOption === 'RESCUE_PARTNER' && 'Partner rescues have been notified.'}
          {selectedOption === 'COMMUNITY_CAT' && 'Community cat workflow started.'}
          {selectedOption === 'TRANSPORT_OUT' && 'Transport coordination has been initiated.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-semibold text-red-400">Capacity Crisis</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {shelterName || 'Local shelter'} cannot accept this animal
            {refusalReason && ` due to ${refusalReason.toLowerCase()}`}.
          </p>
        </div>
      </div>

      {/* Case info */}
      <div className="bg-zinc-900/50 rounded-lg p-4 mb-6">
        <div className="text-sm text-zinc-500">Case #{caseNumber}</div>
        <div className="font-medium">{animalDescription}</div>
        <div className="text-sm text-zinc-400">{county} County</div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        <p className="text-sm text-zinc-400 font-medium">Select an alternative:</p>
        {OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'ring-2 ring-amber-500 ' + option.color
                  : option.color
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${option.iconColor}`} />
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-zinc-400">{option.description}</div>
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-amber-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes */}
      {selectedOption && (
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">Additional notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special circumstances or requirements..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
          />
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedOption || submitting}
        className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {submitting ? 'Processing...' : 'Proceed with Selected Option'}
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Emergency contact */}
      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-500">
          Animal in immediate danger?{' '}
          <a href="tel:911" className="text-red-400 hover:text-red-300 inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> Call 911
          </a>
        </p>
      </div>
    </div>
  );
}

export default CapacityCrisisWorkflow;
