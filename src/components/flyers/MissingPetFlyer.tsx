'use client';

import { useRef } from 'react';
import { Printer, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MissingPetFlyerProps {
  petName: string;
  species: 'DOG' | 'CAT' | 'BIRD' | 'OTHER';
  breed?: string;
  color: string;
  size?: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  description?: string;
  photoUrl?: string;
  contactPhone: string;
  contactName?: string;
  reward?: string;
  caseNumber?: string;
}

export default function MissingPetFlyer({
  petName,
  species,
  breed,
  color,
  size,
  lastSeenDate,
  lastSeenLocation,
  description,
  photoUrl,
  contactPhone,
  contactName,
  reward,
  caseNumber,
}: MissingPetFlyerProps) {
  const flyerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && flyerRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MISSING - ${petName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; }
              .flyer { 
                width: 8.5in; 
                min-height: 11in; 
                padding: 0.5in;
                background: white;
              }
              .header { 
                background: #dc2626; 
                color: white; 
                text-align: center; 
                padding: 20px;
                font-size: 48px;
                font-weight: 900;
                letter-spacing: 4px;
              }
              .photo-container {
                text-align: center;
                padding: 20px;
              }
              .photo {
                max-width: 100%;
                max-height: 400px;
                border: 4px solid #333;
                border-radius: 8px;
              }
              .no-photo {
                width: 300px;
                height: 300px;
                background: #e5e5e5;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                border: 4px solid #333;
                border-radius: 8px;
                font-size: 24px;
                color: #666;
              }
              .pet-name {
                text-align: center;
                font-size: 42px;
                font-weight: 900;
                padding: 15px;
                background: #fef3c7;
                border: 3px solid #000;
              }
              .details {
                padding: 20px;
                font-size: 18px;
                line-height: 1.6;
              }
              .detail-row {
                display: flex;
                margin-bottom: 8px;
              }
              .detail-label {
                font-weight: bold;
                width: 140px;
              }
              .last-seen {
                background: #fef9c3;
                padding: 15px;
                margin: 15px 0;
                border: 2px solid #000;
                font-size: 20px;
              }
              .contact {
                background: #000;
                color: white;
                text-align: center;
                padding: 25px;
                font-size: 32px;
                font-weight: bold;
              }
              .reward {
                background: #16a34a;
                color: white;
                text-align: center;
                padding: 15px;
                font-size: 28px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                padding: 15px;
                font-size: 14px;
                color: #666;
                border-top: 1px solid #ddd;
                margin-top: 20px;
              }
              .tear-strips {
                display: flex;
                border-top: 2px dashed #000;
                margin-top: 20px;
              }
              .tear-strip {
                flex: 1;
                border-right: 1px dashed #000;
                padding: 10px 5px;
                text-align: center;
                font-size: 12px;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                height: 80px;
              }
              .tear-strip:last-child {
                border-right: none;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="flyer">
              <div class="header">🚨 MISSING ${species === 'DOG' ? 'DOG' : species === 'CAT' ? 'CAT' : 'PET'} 🚨</div>
              
              <div class="photo-container">
                ${photoUrl 
                  ? `<img src="${photoUrl}" alt="${petName}" class="photo" />`
                  : `<div class="no-photo">NO PHOTO<br/>AVAILABLE</div>`
                }
              </div>
              
              <div class="pet-name">"${petName.toUpperCase()}"</div>
              
              <div class="details">
                <div class="detail-row"><span class="detail-label">Species:</span> ${species}</div>
                ${breed ? `<div class="detail-row"><span class="detail-label">Breed:</span> ${breed}</div>` : ''}
                <div class="detail-row"><span class="detail-label">Color:</span> ${color}</div>
                ${size ? `<div class="detail-row"><span class="detail-label">Size:</span> ${size}</div>` : ''}
                ${description ? `<div class="detail-row"><span class="detail-label">Description:</span> ${description}</div>` : ''}
              </div>
              
              <div class="last-seen">
                <strong>📍 LAST SEEN:</strong> ${lastSeenLocation}<br/>
                <strong>📅 DATE:</strong> ${lastSeenDate}
              </div>
              
              ${reward ? `<div class="reward">💰 REWARD: ${reward}</div>` : ''}
              
              <div class="contact">
                📞 CALL: ${contactPhone}
                ${contactName ? `<br/><span style="font-size: 20px;">Ask for ${contactName}</span>` : ''}
              </div>
              
              <div class="footer">
                ${caseNumber ? `Case #${caseNumber} • ` : ''}Powered by PetNexus Mayday • mayday.petnexus.org
              </div>
              
              <div class="tear-strips">
                ${Array(7).fill(null).map(() => `
                  <div class="tear-strip">
                    📞 ${contactPhone}<br/>
                    ${petName}
                  </div>
                `).join('')}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div 
        ref={flyerRef}
        className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md mx-auto"
      >
        {/* Header */}
        <div className="bg-red-600 text-white text-center py-3 px-4">
          <h2 className="text-2xl font-black tracking-wide">
            🚨 MISSING {species === 'DOG' ? 'DOG' : species === 'CAT' ? 'CAT' : 'PET'} 🚨
          </h2>
        </div>

        {/* Photo */}
        <div className="p-4 flex justify-center bg-gray-100">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={petName}
              className="max-h-48 rounded border-2 border-gray-800"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-300 rounded border-2 border-gray-800 flex items-center justify-center text-gray-600">
              No Photo
            </div>
          )}
        </div>

        {/* Pet Name */}
        <div className="bg-amber-100 border-y-2 border-black py-2 px-4 text-center">
          <h3 className="text-2xl font-black text-black">"{petName.toUpperCase()}"</h3>
        </div>

        {/* Details */}
        <div className="p-4 text-black text-sm space-y-1">
          <p><strong>Species:</strong> {species}</p>
          {breed && <p><strong>Breed:</strong> {breed}</p>}
          <p><strong>Color:</strong> {color}</p>
          {size && <p><strong>Size:</strong> {size}</p>}
        </div>

        {/* Last Seen */}
        <div className="bg-yellow-100 border-y-2 border-black p-3 text-black text-sm">
          <p><strong>📍 Last Seen:</strong> {lastSeenLocation}</p>
          <p><strong>📅 Date:</strong> {lastSeenDate}</p>
        </div>

        {/* Reward */}
        {reward && (
          <div className="bg-green-600 text-white text-center py-2 font-bold">
            💰 REWARD: {reward}
          </div>
        )}

        {/* Contact */}
        <div className="bg-black text-white text-center py-4">
          <p className="text-xl font-bold">📞 {contactPhone}</p>
          {contactName && <p className="text-sm">Ask for {contactName}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Flyer
        </Button>
      </div>
    </div>
  );
}
