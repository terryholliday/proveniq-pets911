'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertEscalation } from '@/components/moderator/alert-escalation';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { MissingPetCase, FoundAnimalCase } from '@/lib/types';

// Helper function to get photo labels for each case
function getPhotoLabels(caseId: string): string[] {
  const labels: Record<string, string[]> = {
    '1': ['Front view', 'Side view', 'Red collar detail'],
    '2': ['Face', 'White paws', 'Side profile', 'Tail'],
    '3': ['Injured leg', 'Injury close-up', 'Face', 'Body', 'In carrier']
  };
  return labels[caseId] || [];
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseItem, setCaseItem] = useState<MissingPetCase | FoundAnimalCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadCase(params.id as string);
    }
  }, [params.id]);

  const loadCase = async (caseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data for demonstration
      const mockCases: Record<string, MissingPetCase | FoundAnimalCase> = {
        '1': {
          id: '1',
          case_reference: 'MP-2024-001',
          status: 'ACTIVE',
          pet_name: 'Buddy',
          species: 'DOG',
          breed: 'Golden Retriever',
          color_primary: 'Golden',
          color_secondary: null,
          distinguishing_features: 'Red collar, friendly',
          weight_lbs: 65,
          age_years: 5,
          sex: 'M',
          is_neutered: true,
          microchip_id: null,
          photo_urls: [
          'https://picsum.photos/seed/buddy-golden-front/400/300.jpg',
          'https://picsum.photos/seed/buddy-golden-side/400/300.jpg',
          'https://picsum.photos/seed/buddy-golden-collar/400/300.jpg'
        ],
          last_seen_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          last_seen_lat: 37.7749,
          last_seen_lng: -122.4194,
          county: 'GREENBRIER',
          contact_name: 'John Smith',
          contact_phone: '+1-304-555-0101',
          contact_email: 'john.smith@email.com',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        '2': {
          id: '2',
          case_reference: 'FA-2024-002',
          status: 'ACTIVE',
          pet_name: undefined,
          species: 'CAT',
          breed_guess: 'Tabby',
          color_primary: 'Gray',
          color_secondary: 'White',
          distinguishing_features: 'White paws, timid',
          weight_lbs_estimate: 10,
          age_estimate: '2 years',
          sex: 'F',
          is_neutered: true,
          microchip_id: null,
          photo_urls: [
          'https://picsum.photos/seed/tabby-gray-face/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-paws/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-side/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-tail/400/300.jpg'
        ],
          found_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          found_lat: 38.3498,
          found_lng: -81.6326,
          county: 'KANAWHA',
          condition_notes: 'Seems healthy but scared',
          needs_immediate_vet: false,
          contact_name: 'Jane Doe',
          contact_phone: '+1-304-555-0102',
          contact_email: 'jane.doe@email.com',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        '3': {
          id: '3',
          case_reference: 'FA-2024-003',
          status: 'ACTIVE',
          pet_name: undefined,
          species: 'DOG',
          breed_guess: 'Unknown',
          color_primary: 'Brown',
          color_secondary: 'Black',
          distinguishing_features: 'Injured leg, limping',
          weight_lbs_estimate: 40,
          age_estimate: '3 years',
          sex: 'M',
          is_neutered: false,
          has_collar: true,
          collar_description: null,
          microchip_scanned: false,
          microchip_id: null,
          photo_urls: [
          'https://picsum.photos/seed/dog-brown-injured-leg/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-injury-closeup/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-face/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-body/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-carrier/400/300.jpg'
        ],
          found_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          found_lat: 37.7954,
          found_lng: -80.4462,
          county: 'GREENBRIER',
          condition_notes: 'Visible injury on front leg, bleeding',
          needs_immediate_vet: true,
          contact_name: 'Mike Johnson',
          contact_phone: '+1-304-555-0103',
          contact_email: null,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const caseData = mockCases[caseId] as any;
      if (!caseData) {
        setError('Case not found');
        return;
      }

      setCaseItem(caseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Case not found'}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/admin/pigpig">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMissing = 'pet_name' in caseItem;
  const missingCase = isMissing ? caseItem as MissingPetCase : null;
  const foundCase = !isMissing ? caseItem as FoundAnimalCase : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/pigpig">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isMissing ? 'default' : 'warning'}>
                  {isMissing ? 'Missing' : 'Found'}
                </Badge>
                <Badge variant="outline">{(caseItem as any).county}</Badge>
                <StatusBadge status={caseItem.status} />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900">
                {missingCase?.pet_name || `${caseItem.species} - ${caseItem.case_reference}`}
              </h1>
              
              <p className="text-gray-600 mt-1">
                Case Reference: {caseItem.case_reference}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {caseItem.photo_urls && caseItem.photo_urls.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={caseItem.photo_urls[0]}
                        alt={missingCase?.pet_name || caseItem.species}
                        className="w-full h-96 object-cover rounded-lg bg-gray-100"
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {getPhotoLabels(caseItem.id)[0] || 'Main photo'}
                      </div>
                      {caseItem.photo_urls.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                          +{caseItem.photo_urls.length - 1} more
                        </div>
                      )}
                    </div>
                    {caseItem.photo_urls.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {caseItem.photo_urls.slice(1, 5).map((url, index) => {
                          const photoLabels = getPhotoLabels(caseItem.id);
                          const labelIndex = index;
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`${missingCase?.pet_name || caseItem.species} ${index + 2}`}
                                className="w-full h-24 object-cover rounded-lg bg-gray-100 cursor-pointer hover:opacity-80"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                {photoLabels[labelIndex + 1]}
                              </div>
                            </div>
                          );
                        })}
                        {caseItem.photo_urls.length > 5 && (
                          <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <span className="text-gray-600 font-medium">
                              +{caseItem.photo_urls.length - 5}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No photos available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Status Alert */}
            {foundCase?.needs_immediate_vet && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This animal needs immediate veterinary attention.
                </AlertDescription>
              </Alert>
            )}

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Species</label>
                    <p className="text-lg">{caseItem.species}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Breed</label>
                    <p className="text-lg">{foundCase?.breed_guess || missingCase?.breed || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Color</label>
                    <p className="text-lg">
                      {caseItem.color_primary || 'Unknown'}
                      {caseItem.color_secondary && ` / ${caseItem.color_secondary}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Size</label>
                    <p className="text-lg capitalize">{(missingCase as any)?.size || 'Unknown'}</p>
                  </div>
                </div>

                {foundCase?.condition_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Condition Notes</label>
                    <p className="mt-1 text-gray-700">{foundCase.condition_notes}</p>
                  </div>
                )}

                {missingCase?.microchip_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Microchip ID</label>
                    <p className="mt-1 font-mono">{missingCase.microchip_id}</p>
                  </div>
                )}

                {caseItem.distinguishing_features && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Distinguishing Features</label>
                    <p className="mt-1 text-gray-700">{caseItem.distinguishing_features}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Weight</label>
                    <p className="text-lg">{foundCase?.weight_lbs_estimate || missingCase?.weight_lbs ? `${foundCase?.weight_lbs_estimate || missingCase?.weight_lbs} lbs` : 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Age</label>
                    <p className="text-lg">{foundCase?.age_estimate || missingCase?.age_years ? `${foundCase?.age_estimate || missingCase?.age_years}${missingCase?.age_years ? ' years' : ''}` : 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sex</label>
                    <p className="text-lg">{caseItem.sex || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Neutered/Spayed</label>
                    <p className="text-lg">{missingCase?.is_neutered ? 'Yes' : foundCase?.has_collar !== null ? (foundCase?.has_collar ? 'Has Collar' : 'No Collar') : 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mt-2">
                  {isMissing ? `Last seen: ${new Date(missingCase?.last_seen_at || '').toLocaleDateString()}` : `Found: ${new Date(foundCase?.found_at || '').toLocaleDateString()}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="flex items-center gap-2 mt-1">
                    <span>{(caseItem as any).contact_name}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${(caseItem as any).contact_phone}`} className="text-blue-600 hover:underline">
                      {(caseItem as any).contact_phone}
                    </a>
                  </p>
                </div>
                {(caseItem as any).contact_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${(caseItem as any).contact_email}`} className="text-blue-600 hover:underline">
                        {(caseItem as any).contact_email}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert Escalation */}
            <AlertEscalation
              caseId={caseItem.id}
              caseType={isMissing ? 'missing' : 'found'}
              createdAt={caseItem.created_at}
              species={caseItem.species}
            />

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Reported:</span>
                  <span>{new Date(caseItem.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isMissing ? 'Last seen:' : 'Found:'}</span>
                  <span>{new Date(isMissing ? missingCase?.last_seen_at || '' : foundCase?.found_at || '').toLocaleDateString()}</span>
                </div>
                {caseItem.updated_at !== caseItem.created_at && (
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{new Date(caseItem.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    PENDING_VERIFY: { variant: 'warning', label: 'Pending' },
    MATCHED: { variant: 'default', label: 'Matched' },
    CLOSED_REUNITED: { variant: 'secondary', label: 'Reunited' },
    CLOSED_ADOPTED: { variant: 'secondary', label: 'Adopted' },
    CLOSED_DECEASED: { variant: 'destructive', label: 'Deceased' },
    CLOSED_EXPIRED: { variant: 'secondary', label: 'Expired' },
    CLOSED_DUPLICATE: { variant: 'secondary', label: 'Duplicate' },
    LOCKED: { variant: 'destructive', label: 'Locked' },
    ESCALATED_TO_SHELTER: { variant: 'warning', label: 'Escalated to Shelter' },
  };

  const config = statusConfig[status] || { variant: 'secondary', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
