'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      // TODO: Replace with actual API call
      // For now, return mock data or redirect
      setError('Case details not yet implemented. Please check back later.');
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

  const isMissing = caseItem.type === 'missing';
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
                <Badge variant="outline">{caseItem.county}</Badge>
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
                    <p className="text-lg">{caseItem.breed || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Color</label>
                    <p className="text-lg">{caseItem.color || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Size</label>
                    <p className="text-lg capitalize">{caseItem.size || 'Unknown'}</p>
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
                <p className="text-gray-700">{caseItem.location_description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Last seen: {new Date(caseItem.last_seen_date).toLocaleDateString()}
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
                    <span>{caseItem.contact_name}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${caseItem.contact_phone}`} className="text-blue-600 hover:underline">
                      {caseItem.contact_phone}
                    </a>
                  </p>
                </div>
                {caseItem.contact_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${caseItem.contact_email}`} className="text-blue-600 hover:underline">
                        {caseItem.contact_email}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <span>Last seen:</span>
                  <span>{new Date(caseItem.last_seen_date).toLocaleDateString()}</span>
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
  };

  const config = statusConfig[status] || { variant: 'secondary', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
