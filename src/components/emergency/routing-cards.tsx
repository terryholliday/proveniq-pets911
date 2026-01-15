'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  Navigation, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  MapPin,
  Info,
  Activity,
  Heart,
  Car,
  Building2,
  XCircle
} from 'lucide-react';
import { useCountyPack } from '@/lib/hooks/use-county-pack';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { reverseGeocode, formatGpsCoordinates, getCurrentPosition } from '@/lib/utils/geocode';
import type { ConditionTriage, County, EmergencyContact, MunicipalOutcome } from '@/lib/types';
import { VolunteerDispatchCard } from './VolunteerDispatchCard';
import { useAuth } from '@/contexts/AuthContext';

interface RoutingCardsProps {
  condition: ConditionTriage;
  county: County;
  onNotifyVet?: (contact: EmergencyContact) => void;
  onLogOutcome?: (outcome: MunicipalOutcome, contactId: string) => void;
}

/**
 * Step B: Routing cards based on condition and county
 * Per task spec: Uses cached county pack data
 */
export function RoutingCards({ 
  condition, 
  county,
  onNotifyVet,
  onLogOutcome 
}: RoutingCardsProps) {
  const { erVets, animalControl, isStale } = useCountyPack(county);
  const { state: networkState } = useNetworkStatus();
  const [location, setLocation] = useState<{ lat: number; lng: number; text: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Get current location on mount
  useEffect(() => {
    const getLocation = async () => {
      setIsLoadingLocation(true);
      const pos = await getCurrentPosition();
      if (pos) {
        const text = await reverseGeocode(pos.lat, pos.lng);
        setLocation({ ...pos, text });
      }
      setIsLoadingLocation(false);
    };
    getLocation();
  }, []);

  if (condition === 'CRITICAL') {
    return (
      <CriticalRoutingCard
        erVets={erVets}
        location={location}
        isLoadingLocation={isLoadingLocation}
        networkState={networkState}
        isStale={isStale}
        onNotifyVet={onNotifyVet}
      />
    );
  }

  if (condition === 'INJURED_STABLE') {
    return (
      <InjuredRoutingCard
        erVets={erVets}
        animalControl={animalControl}
        location={location}
        isStale={isStale}
        county={county}
        onNotifyVet={onNotifyVet}
        onLogOutcome={onLogOutcome}
      />
    );
  }

  if (condition === 'DECEASED') {
    return (
      <DeceasedRoutingCard
        animalControl={animalControl}
        location={location}
        isStale={isStale}
        onLogOutcome={onLogOutcome}
      />
    );
  }

  return (
    <HealthyRoutingCard
      animalControl={animalControl}
      location={location}
      isStale={isStale}
      onLogOutcome={onLogOutcome}
    />
  );
}

/**
 * Critical condition: ER Vet card with notify option
 */
function CriticalRoutingCard({
  erVets,
  location,
  isLoadingLocation,
  networkState,
  isStale,
  onNotifyVet,
}: {
  erVets: EmergencyContact[];
  location: { lat: number; lng: number; text: string } | null;
  isLoadingLocation: boolean;
  networkState: string;
  isStale: boolean;
  onNotifyVet?: (contact: EmergencyContact) => void;
}) {
  const [selectedVet, setSelectedVet] = useState<EmergencyContact | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  const primaryVet = erVets.find(v => v.is_24_hour) || erVets[0];

  const handleGetDirections = (contact: EmergencyContact) => {
    if (contact.address) {
      const encoded = encodeURIComponent(contact.address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  const handleNotifyVet = async (contact: EmergencyContact) => {
    setIsNotifying(true);
    setSelectedVet(contact);
    try {
      await onNotifyVet?.(contact);
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="font-semibold">
          CRITICAL EMERGENCY - Urgent Humane Care Required
        </AlertDescription>
      </Alert>

      {isStale && (
        <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Showing cached data. Refresh when online for latest info.
          </AlertDescription>
        </Alert>
      )}

      <LocationDisplay 
        location={location} 
        isLoading={isLoadingLocation} 
      />

      {primaryVet ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800">{primaryVet.name}</CardTitle>
              {primaryVet.is_24_hour && (
                <Badge variant="critical">24 HOUR</Badge>
              )}
            </div>
            {primaryVet.address && (
              <p className="text-sm text-red-700">{primaryVet.address}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {primaryVet.phone_primary && (
              <Button
                variant="critical"
                size="lg"
                className="w-full"
                onClick={() => window.location.href = `tel:${primaryVet.phone_primary}`}
              >
                <Phone className="h-5 w-5 mr-2" />
                Call: {primaryVet.phone_primary}
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleGetDirections(primaryVet)}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Get Directions
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => handleNotifyVet(primaryVet)}
              disabled={isNotifying || networkState === 'OFFLINE'}
            >
              {isNotifying ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Notifying...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  I&apos;m En Route - Notify Vet
                </>
              )}
            </Button>

            {networkState === 'OFFLINE' && (
              <p className="text-xs text-center text-gray-500">
                Vet notification will be queued until you&apos;re back online
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">
              No emergency vets found for this county. Please call 911.
            </p>
            <Button
              variant="critical"
              size="lg"
              className="mt-4"
              onClick={() => window.location.href = 'tel:911'}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call 911
            </Button>
          </CardContent>
        </Card>
      )}

      {erVets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other Emergency Vets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {erVets.slice(1).map((vet) => (
              <div key={vet.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{vet.name}</p>
                  {vet.phone_primary && (
                    <p className="text-xs text-gray-500">{vet.phone_primary}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = `tel:${vet.phone_primary}`}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Injured but stable: Show dispatch/ACO phone with script
 */
function InjuredRoutingCard({
  erVets,
  animalControl,
  location,
  isStale,
  county,
  onNotifyVet,
  onLogOutcome,
}: {
  erVets: EmergencyContact[];
  animalControl: EmergencyContact[];
  location: { lat: number; lng: number; text: string } | null;
  isStale: boolean;
  county: County;
  onNotifyVet?: (contact: EmergencyContact) => void;
  onLogOutcome?: (outcome: MunicipalOutcome, contactId: string) => void;
}) {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Animal needs care but is stable. Contact options below.
        </AlertDescription>
      </Alert>

      {isStale && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Showing cached data from your county pack.
          </AlertDescription>
        </Alert>
      )}

      <LocationDisplay location={location} isLoading={false} />

      <Card>
        <CardHeader>
          <CardTitle>Can You Transport the Animal?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* YES - Can Transport */}
          <div className="p-4 border-2 border-green-200 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-800">Yes, I can transport</p>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Take the animal to the nearest vet clinic:
            </p>
            {erVets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-green-700 mb-2">
                  We'll call vets on your behalf to find one that can accept the animal:
                </p>
                {erVets.slice(0, 3).map((vet) => (
                  <Button
                    key={vet.id}
                    variant="default"
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 h-auto py-3 whitespace-normal text-left"
                    onClick={() => onNotifyVet?.(vet)}
                  >
                    <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="flex-1">Notify {vet.name}</span>
                  </Button>
                ))}
                {erVets.length > 3 && (
                  <p className="text-xs text-green-600 text-center">
                    +{erVets.length - 3} more clinics available
                  </p>
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => window.location.href = 'tel:911'}
              >
                <Phone className="h-5 w-5 mr-2" />
                Call 911 for Emergency Assistance
              </Button>
            )}
          </div>

          {/* NO - Cannot Transport */}
          <div className="space-y-3">
            <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                <p className="font-semibold text-amber-800">No, I cannot transport</p>
              </div>
              <p className="text-sm text-amber-700">
                Contact one of these resources for assistance:
              </p>
            </div>

            {/* Option 1: Volunteer Helper Network */}
            {user && (
              <VolunteerDispatchCard
                county={county}
                species="DOG"
                animalSize="MEDIUM"
                pickupLat={location?.lat || (county === 'GREENBRIER' ? 37.7954 : 38.3498)}
                pickupLng={location?.lng || (county === 'GREENBRIER' ? -80.4462 : -81.6326)}
                pickupAddress={location?.text || `${county} County, WV`}
                requesterId={user.id}
                requesterName={user.email || 'Anonymous'}
                requesterPhone=""
              />
            )}

            {/* Option 2: Animal Control / Humane Society */}
            <div className="p-4 border-2 border-slate-200 bg-slate-50 rounded-xl space-y-3">
              {animalControl.length > 0 ? (
                animalControl.map((contact) => (
                  <DispatchCard 
                    key={contact.id}
                    contact={contact}
                    onLogOutcome={onLogOutcome}
                  />
                ))
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full bg-slate-600 hover:bg-slate-700"
                  onClick={() => window.location.href = 'tel:911'}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call 911 for Assistance
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Healthy animal: Show ACO contact options
 */
function HealthyRoutingCard({
  animalControl,
  location,
  isStale,
  onLogOutcome,
}: {
  animalControl: EmergencyContact[];
  location: { lat: number; lng: number; text: string } | null;
  isStale: boolean;
  onLogOutcome?: (outcome: MunicipalOutcome, contactId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Alert variant="info">
        <Heart className="h-4 w-4" />
        <AlertDescription>
          Animal appears healthy. Options to report or assist below.
        </AlertDescription>
      </Alert>

      <LocationDisplay location={location} isLoading={false} />

      <Card>
        <CardHeader>
          <CardTitle>Report or Request Assistance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {animalControl.length > 0 ? (
            animalControl.map((contact) => (
              <DispatchCard 
                key={contact.id}
                contact={contact}
                onLogOutcome={onLogOutcome}
              />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No animal control contacts found for this county.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Deceased animal: Show respectful handling options
 */
function DeceasedRoutingCard({
  animalControl,
  location,
  isStale,
  onLogOutcome,
}: {
  animalControl: EmergencyContact[];
  location: { lat: number; lng: number; text: string } | null;
  isStale: boolean;
  onLogOutcome?: (outcome: MunicipalOutcome, contactId: string) => void;
}) {
  const [callStarted, setCallStarted] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<MunicipalOutcome | null>(null);
  const [showScript, setShowScript] = useState(false);

  const handleCall = (contactId: string) => {
    setCallStarted(true);
    const contact = animalControl.find(ac => ac.id === contactId);
    if (contact?.phone_primary) {
      window.location.href = `tel:${contact.phone_primary}`;
    }
  };

  const handleOutcome = (outcome: MunicipalOutcome, contactId: string) => {
    setSelectedOutcome(outcome);
    onLogOutcome?.(outcome, contactId);
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="font-semibold">
          Animal Has Passed Away - Respectful Handling Required
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertDescription>
          Please contact animal control for proper handling and disposal. Do not leave the animal where it may create a traffic hazard or public health concern.
        </AlertDescription>
      </Alert>

      <LocationDisplay location={location} isLoading={false} />

      <Card>
        <CardHeader>
          <CardTitle>Contact Animal Control</CardTitle>
          <p className="text-sm text-gray-600">
            Report the location for respectful removal and disposal
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {animalControl.map((ac) => (
            <div key={ac.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{ac.name}</h4>
                  {ac.address && (
                    <p className="text-sm text-gray-600">{ac.address}</p>
                  )}
                </div>
                {ac.is_24_hour && (
                  <Badge variant="secondary">24 Hour</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                {ac.phone_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCall(ac.id)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call: {ac.phone_primary}
                  </Button>
                )}

                {callStarted && !selectedOutcome && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      What was the response?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOutcome('OFFICER_DISPATCHED', ac.id)}
                      >
                        Officer Dispatched
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOutcome('CALLBACK_PROMISED', ac.id)}
                      >
                        Callback Promised
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOutcome('NO_ANSWER', ac.id)}
                      >
                        No Answer
                      </Button>
                    </div>
                  </div>
                )}

                {selectedOutcome && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Outcome logged: {selectedOutcome.replace(/_/g, ' ').toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {animalControl.length === 0 && (
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                No animal control contacts found for this county.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Please call your local police department or sheriff's office for assistance.
              </p>
            </CardContent>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Dispatch/ACO contact card with call script
 */
function DispatchCard({
  contact,
  onLogOutcome,
}: {
  contact: EmergencyContact;
  onLogOutcome?: (outcome: MunicipalOutcome, contactId: string) => void;
}) {
  const [showScript, setShowScript] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<MunicipalOutcome | null>(null);

  const handleCall = () => {
    setCallStarted(true);
    window.location.href = `tel:${contact.phone_primary}`;
  };

  const handleLogOutcome = (outcome: MunicipalOutcome) => {
    setSelectedOutcome(outcome);
    onLogOutcome?.(outcome, contact.id);
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{contact.name}</CardTitle>
          {contact.is_24_hour ? (
            <Badge variant="success">24 Hour</Badge>
          ) : (
            <Badge variant="secondary">Business Hours</Badge>
          )}
        </div>
        {contact.address && (
          <p className="text-xs text-gray-500">{contact.address}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="default"
          className="w-full text-sm"
          onClick={handleCall}
        >
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          {contact.phone_primary}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowScript(!showScript)}
        >
          {showScript ? 'Hide' : 'Show'} Call Script
        </Button>

        {showScript && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium text-blue-800">Suggested Script:</p>
            <p className="text-blue-700">
              &quot;Hello, I&apos;m calling to request assistance with a found animal. 
              County ordinance indicates officers should respond; I&apos;m requesting assistance.&quot;
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Describe: Location, animal type, condition, your contact info
            </p>
            <p className="text-xs text-blue-600">
              Ask: &quot;May I have your name and a reference number for this call?&quot;
            </p>
          </div>
        )}

        {callStarted && !selectedOutcome && (
          <div className="border-t pt-3 mt-3">
            <p className="text-sm font-medium mb-2">What was the outcome?</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'OFFICER_DISPATCHED', label: 'Dispatched' },
                { value: 'CALLBACK_PROMISED', label: 'Callback' },
                { value: 'NO_ANSWER', label: 'No Answer' },
                { value: 'REFERRED_ELSEWHERE', label: 'Referred' },
                { value: 'DECLINED', label: 'Declined' },
                { value: 'UNKNOWN', label: 'Unknown' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className="text-xs py-2"
                  onClick={() => handleLogOutcome(option.value as MunicipalOutcome)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedOutcome && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Outcome logged: {selectedOutcome.replace('_', ' ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Location display with GPS fallback
 */
function LocationDisplay({
  location,
  isLoading,
}: {
  location: { lat: number; lng: number; text: string } | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="h-4 w-4 animate-pulse" />
        Getting location...
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="h-4 w-4" />
        Location unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-100 p-2 rounded">
      <MapPin className="h-4 w-4 text-gray-600" />
      <span className="text-gray-700">{location.text}</span>
    </div>
  );
}
