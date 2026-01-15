/**
 * Digital Takeaway Cards
 * Screenshottable summary cards for vet visits and lost pet situations
 */

import React from 'react';
import {
  type VetERCardData,
  type LostPetCardData,
} from './session-facts';

// ============================================================================
// VET ER CARD
// ============================================================================

interface VetERCardProps {
  data: VetERCardData;
}

export const VetERCard: React.FC<VetERCardProps> = ({ data }) => {
  return (
    <div className="bg-white text-black p-4 rounded-lg font-mono text-sm max-w-md mx-auto shadow-lg">
      <div className="border-b-2 border-black pb-2 mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🏥 VET EMERGENCY SUMMARY
        </h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex">
          <span className="w-24 font-bold">Pet Name:</span>
          <span>{data.petName}</span>
        </div>
        
        <div className="flex">
          <span className="w-24 font-bold">Species:</span>
          <span>
            {data.species}
            {data.breed && ` (${data.breed})`}
          </span>
        </div>
        
        {data.age && (
          <div className="flex">
            <span className="w-24 font-bold">Age:</span>
            <span>{data.age}</span>
          </div>
        )}
        
        <div className="flex">
          <span className="w-24 font-bold">Symptoms:</span>
          <span className="font-semibold text-red-700">{data.symptoms}</span>
        </div>
        
        {data.duration && (
          <div className="flex">
            <span className="w-24 font-bold">Duration:</span>
            <span>{data.duration}</span>
          </div>
        )}
        
        {data.ownerName && (
          <div className="flex">
            <span className="w-24 font-bold">Owner:</span>
            <span>{data.ownerName}</span>
          </div>
        )}
        
        {data.ownerPhone && (
          <div className="flex">
            <span className="w-24 font-bold">Phone:</span>
            <span>{data.ownerPhone}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-300">
        <p className="text-gray-600 text-xs text-center">
          Generated: {data.timestamp}
        </p>
        <p className="text-gray-500 text-xs text-center mt-1">
          (Screenshot this to show the receptionist)
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// LOST PET FLYER
// ============================================================================

interface LostPetFlyerProps {
  data: LostPetCardData;
  showReward?: boolean;
}

export const LostPetFlyer: React.FC<LostPetFlyerProps> = ({
  data,
  showReward = false,
}) => {
  return (
    <div className="bg-white text-black p-6 rounded-lg max-w-md mx-auto shadow-lg">
      <div className="text-center border-4 border-red-600 p-4 mb-4">
        <h2 className="text-3xl font-black text-red-600 tracking-wider">
          LOST {data.species.toUpperCase()}
        </h2>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-2xl font-bold">{data.petName}</p>
        {data.breed && (
          <p className="text-lg text-gray-600">{data.breed}</p>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2 text-gray-800">Description:</h3>
        <ul className="space-y-1 text-sm">
          {data.color && <li>• Color: {data.color}</li>}
          {data.age && <li>• Age: {data.age}</li>}
          <li>• Collar: {data.hasCollar ? 'Yes' : 'No'}</li>
          <li>• Microchipped: {data.microchipped ? 'Yes' : 'Unknown'}</li>
        </ul>
      </div>
      
      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2 text-gray-800">Last Seen:</h3>
        <p className="text-lg">{data.lastSeen}</p>
        {data.lastSeenTime && (
          <p className="text-sm text-gray-600">Time: {data.lastSeenTime}</p>
        )}
      </div>
      
      {data.contactPhone && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-1">If found, please call:</p>
          <p className="text-2xl font-bold">{data.contactPhone}</p>
        </div>
      )}
      
      {showReward && (
        <div className="text-center bg-green-100 p-3 rounded-lg">
          <p className="text-xl font-bold text-green-700">💰 REWARD</p>
        </div>
      )}
      
      <p className="text-gray-500 text-xs text-center mt-4">
        (Screenshot and share on social media)
      </p>
    </div>
  );
};

// ============================================================================
// POLICE REPORT CARD
// ============================================================================

interface PoliceReportCardProps {
  petName: string;
  species: string;
  breed?: string;
  lastSeen: string;
  lastSeenTime?: string;
  description?: string;
  ownerName?: string;
  ownerPhone?: string;
}

export const PoliceReportCard: React.FC<PoliceReportCardProps> = ({
  petName,
  species,
  breed,
  lastSeen,
  lastSeenTime,
  description,
  ownerName,
  ownerPhone,
}) => {
  return (
    <div className="bg-white text-black p-4 rounded-lg font-mono text-sm max-w-md mx-auto shadow-lg">
      <div className="border-b-2 border-black pb-2 mb-3">
        <h3 className="font-bold text-lg">
          📋 LOST PET REPORT INFO
        </h3>
        <p className="text-xs text-gray-600">For filing with local authorities</p>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-bold">Pet Name:</span> {petName}
        </div>
        
        <div>
          <span className="font-bold">Species/Breed:</span> {species}
          {breed && ` - ${breed}`}
        </div>
        
        {description && (
          <div>
            <span className="font-bold">Description:</span> {description}
          </div>
        )}
        
        <div>
          <span className="font-bold">Last Seen Location:</span> {lastSeen}
        </div>
        
        {lastSeenTime && (
          <div>
            <span className="font-bold">Last Seen Time:</span> {lastSeenTime}
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-300 mt-3">
          {ownerName && (
            <div>
              <span className="font-bold">Owner Name:</span> {ownerName}
            </div>
          )}
          {ownerPhone && (
            <div>
              <span className="font-bold">Contact Phone:</span> {ownerPhone}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-300">
        <p className="text-gray-500 text-xs text-center">
          Date: {new Date().toLocaleDateString()}
        </p>
        <p className="text-gray-500 text-xs text-center mt-1">
          (Screenshot for your records)
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// TAKEAWAY CARD WRAPPER
// ============================================================================

export type TakeawayCardType = 'vet_er' | 'lost_pet_flyer' | 'police_report';

interface TakeawayCardProps {
  type: TakeawayCardType;
  vetERData?: VetERCardData;
  lostPetData?: LostPetCardData;
  policeReportData?: PoliceReportCardProps;
  onDismiss?: () => void;
}

export const TakeawayCard: React.FC<TakeawayCardProps> = ({
  type,
  vetERData,
  lostPetData,
  policeReportData,
  onDismiss,
}) => {
  return (
    <div className="relative my-4">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute -top-2 -right-2 bg-slate-600 hover:bg-slate-500 text-white w-8 h-8 rounded-full flex items-center justify-center z-10"
          aria-label="Dismiss card"
        >
          ✕
        </button>
      )}
      
      {type === 'vet_er' && vetERData && <VetERCard data={vetERData} />}
      {type === 'lost_pet_flyer' && lostPetData && <LostPetFlyer data={lostPetData} />}
      {type === 'police_report' && policeReportData && <PoliceReportCard {...policeReportData} />}
    </div>
  );
};

export default TakeawayCard;
