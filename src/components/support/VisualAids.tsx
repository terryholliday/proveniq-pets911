/**
 * Visual Aids Components
 * Educational visual aids for pet emergencies
 */

import React from 'react';

// ============================================================================
// GUM COLOR CHART
// ============================================================================

export const GumColorChart: React.FC = () => {
  const colors = [
    {
      color: 'Pink',
      bgColor: 'bg-pink-300',
      textColor: 'text-black',
      meaning: 'Healthy',
      urgent: false,
    },
    {
      color: 'Pale/White',
      bgColor: 'bg-gray-200',
      textColor: 'text-black',
      meaning: 'Shock / Anemia',
      urgent: true,
    },
    {
      color: 'Blue/Purple',
      bgColor: 'bg-purple-400',
      textColor: 'text-black',
      meaning: 'No Oxygen',
      urgent: true,
    },
    {
      color: 'Bright Red',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      meaning: 'Overheating / Toxin',
      urgent: true,
    },
    {
      color: 'Yellow',
      bgColor: 'bg-yellow-300',
      textColor: 'text-black',
      meaning: 'Liver Issue',
      urgent: true,
    },
  ];
  
  return (
    <div className="bg-slate-700 rounded-lg p-4 my-3">
      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
        <span>🔍</span> Check Gum Color
      </h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-sm">
        {colors.map((item) => (
          <div
            key={item.color}
            className={`${item.bgColor} ${item.textColor} p-3 rounded-lg`}
          >
            <strong className="block">{item.color}</strong>
            <span className="text-xs">
              {item.urgent ? '⚠️ ' : ''}{item.meaning}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-slate-300 text-xs space-y-1">
        <p>✓ Press gently on gum — should return to pink in 2 seconds</p>
        <p className="text-red-300">⚠️ All abnormal colors require immediate vet care</p>
      </div>
    </div>
  );
};

// ============================================================================
// HEIMLICH DIAGRAM FOR DOGS
// ============================================================================

export const HeimlichDiagram: React.FC = () => {
  return (
    <div className="bg-slate-700 rounded-lg p-4 my-3">
      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
        <span>🆘</span> Choking: Heimlich for Dogs
      </h4>
      
      <div className="space-y-4">
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">Large Dog (over 25 lbs)</h5>
          <ol className="text-slate-200 text-sm space-y-1 list-decimal list-inside">
            <li>Stand behind the dog</li>
            <li>Place fist below ribcage (soft spot before ribs)</li>
            <li>Thrust firmly upward and forward 3-5 times</li>
            <li>Check mouth after each attempt</li>
          </ol>
        </div>
        
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">Small Dog (under 25 lbs)</h5>
          <ol className="text-slate-200 text-sm space-y-1 list-decimal list-inside">
            <li>Hold dog with back against your chest</li>
            <li>Support with one hand under chest</li>
            <li>Use other hand to thrust upward below ribs</li>
            <li>Check mouth after each attempt</li>
          </ol>
        </div>
        
        <div className="text-slate-300 text-xs">
          <p>⚠️ Even if object is dislodged, see vet — internal damage may occur</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CAT HEIMLICH
// ============================================================================

export const CatHeimlichDiagram: React.FC = () => {
  return (
    <div className="bg-slate-700 rounded-lg p-4 my-3">
      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
        <span>🆘</span> Choking: Heimlich for Cats
      </h4>
      
      <div className="bg-slate-600 rounded-lg p-3">
        <ol className="text-slate-200 text-sm space-y-2 list-decimal list-inside">
          <li>Hold cat with back against your chest</li>
          <li>Gently open mouth and check for visible obstruction</li>
          <li>If visible, try to sweep it out carefully with finger</li>
          <li>If not visible, place hands below ribcage</li>
          <li>Give 3-5 quick compressions inward and upward</li>
          <li>Check mouth between compressions</li>
        </ol>
      </div>
      
      <div className="mt-3 text-slate-300 text-xs">
        <p>⚠️ Cats are delicate — use less force than for dogs</p>
        <p className="text-red-300">⚠️ Get to vet immediately, even if successful</p>
      </div>
    </div>
  );
};

// ============================================================================
// CPR STEPS
// ============================================================================

export const CPRSteps: React.FC = () => {
  return (
    <div className="bg-slate-700 rounded-lg p-4 my-3">
      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
        <span>❤️</span> Pet CPR Guide
      </h4>
      
      <div className="space-y-4">
        <div className="bg-red-900/50 rounded-lg p-3">
          <p className="text-red-200 text-sm font-medium mb-2">
            ⚠️ Only perform if pet is unconscious and not breathing
          </p>
        </div>
        
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">Check First</h5>
          <ul className="text-slate-200 text-sm space-y-1">
            <li>• Is the pet responsive? (Tap and call name)</li>
            <li>• Is the pet breathing? (Watch chest movement)</li>
            <li>• Is there a pulse? (Inside back leg)</li>
          </ul>
        </div>
        
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">If No Breathing</h5>
          <ol className="text-slate-200 text-sm space-y-1 list-decimal list-inside">
            <li>Lay pet on right side on flat surface</li>
            <li>Extend head to straighten airway</li>
            <li>Close mouth, seal lips with hand</li>
            <li>Breathe into nose until chest rises</li>
            <li>Give 1 breath every 3-5 seconds</li>
          </ol>
        </div>
        
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">Chest Compressions</h5>
          <ul className="text-slate-200 text-sm space-y-1">
            <li>• <strong>Dogs:</strong> Compress at widest part of chest</li>
            <li>• <strong>Cats/Small dogs:</strong> Cup chest with hand</li>
            <li>• Rate: 100-120 compressions/minute</li>
            <li>• Depth: 1/3 to 1/2 chest depth</li>
            <li>• Ratio: 30 compressions : 2 breaths</li>
          </ul>
        </div>
        
        <div className="text-slate-300 text-xs">
          <p className="text-red-300 font-medium">
            🚨 Call ahead to vet while performing CPR if possible
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// POISON FIRST AID
// ============================================================================

export const PoisonFirstAid: React.FC = () => {
  return (
    <div className="bg-slate-700 rounded-lg p-4 my-3">
      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
        <span>☠️</span> Poison Emergency
      </h4>
      
      <div className="space-y-3">
        <div className="bg-red-900/50 rounded-lg p-3">
          <p className="text-red-200 text-sm font-medium">
            🚫 Do NOT induce vomiting unless instructed by a vet
          </p>
        </div>
        
        <div className="bg-slate-600 rounded-lg p-3">
          <h5 className="text-yellow-300 font-medium mb-2">Information to Gather</h5>
          <ul className="text-slate-200 text-sm space-y-1">
            <li>• What was ingested?</li>
            <li>• How much?</li>
            <li>• When?</li>
            <li>• Pet's weight</li>
            <li>• Current symptoms</li>
          </ul>
        </div>
        
        <div className="bg-blue-900/50 rounded-lg p-3">
          <p className="text-blue-200 text-sm">
            📞 ASPCA Poison Control: <strong>888-426-4435</strong>
          </p>
          <p className="text-blue-300 text-xs mt-1">(Consultation fee may apply)</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VISUAL AID WRAPPER
// ============================================================================

export type VisualAidType = 'gum_color_chart' | 'heimlich_diagram' | 'cpr_steps' | 'poison_first_aid' | 'cat_heimlich';

interface VisualAidProps {
  type: VisualAidType;
  onDismiss?: () => void;
}

export const VisualAid: React.FC<VisualAidProps> = ({ type, onDismiss }) => {
  const renderAid = () => {
    switch (type) {
      case 'gum_color_chart':
        return <GumColorChart />;
      case 'heimlich_diagram':
        return <HeimlichDiagram />;
      case 'cat_heimlich':
        return <CatHeimlichDiagram />;
      case 'cpr_steps':
        return <CPRSteps />;
      case 'poison_first_aid':
        return <PoisonFirstAid />;
      default:
        return null;
    }
  };
  
  return (
    <div className="relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-white z-10"
          aria-label="Dismiss visual aid"
        >
          ✕
        </button>
      )}
      {renderAid()}
    </div>
  );
};

export default VisualAid;
