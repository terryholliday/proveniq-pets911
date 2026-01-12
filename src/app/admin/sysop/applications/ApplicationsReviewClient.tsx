"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Clock,
  Shield,
  Truck,
  Home,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type Props = {
  sysopName: string;
  sysopUserId: string;
};

type VolunteerApplication = {
  id: string;
  user_id: string;
  status: string;
  display_name: string;
  phone: string;
  email: string | null;
  primary_county: string;
  address_city: string;
  address_zip: string;
  capabilities: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  has_vehicle: boolean;
  vehicle_type: string | null;
  can_transport_crate: boolean;
  max_animal_size: string | null;
  available_weekdays: boolean;
  available_weekends: boolean;
  available_nights: boolean;
  available_immediately: boolean;
  max_response_radius_miles: number;
  background_check_completed: boolean;
  created_at: string;
  updated_at: string;
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  MODERATOR: <Shield className="h-4 w-4" />,
  TRANSPORT: <Truck className="h-4 w-4" />,
  FOSTER: <Home className="h-4 w-4" />,
  EMERGENCY_RESPONSE: <AlertTriangle className="h-4 w-4" />,
};

const ROLE_LABELS: Record<string, string> = {
  MODERATOR: "Moderator",
  TRANSPORT: "Transport",
  FOSTER: "Foster",
  EMERGENCY_RESPONSE: "Emergency Response",
  COMMUNITY_VOLUNTEER: "Community Volunteer",
  EMERGENCY_FOSTER: "Emergency Foster",
  TRAP: "Trap/TNR",
};

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ApplicationsReviewClient({ sysopName, sysopUserId }: Props) {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) || null,
    [applications, selectedId]
  );

  const loadApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const res = await fetch(`/api/admin/volunteers?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to load applications");
      }

      setApplications(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const handleAction = async (action: "approve" | "reject", volunteerId: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const res = await fetch("/api/admin/volunteers/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ volunteer_id: volunteerId, action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || `Failed to ${action} application`);
      }

      await loadApplications();
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "INACTIVE").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/sysop" className="text-zinc-400 hover:text-zinc-200">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Volunteer Applications</h1>
              <p className="text-sm text-zinc-400">Reviewing as {sysopName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as "pending" | "all")}
            >
              <option value="pending">Pending Review ({pendingCount})</option>
              <option value="all">All Applications</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadApplications} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Application List */}
          <div className="lg:col-span-1 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                {filter === "pending" ? "No pending applications" : "No applications found"}
              </div>
            ) : (
              applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === app.id
                      ? "border-blue-600 bg-blue-950/30"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{app.display_name}</div>
                      <div className="text-sm text-zinc-400">{app.email}</div>
                    </div>
                    <Badge
                      variant={
                        app.status === "ACTIVE"
                          ? "default"
                          : app.status === "INACTIVE"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {app.status === "INACTIVE" ? "Pending" : app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                    {app.capabilities.map((cap) => (
                      <span key={cap} className="flex items-center gap-1">
                        {ROLE_ICONS[cap]}
                        {ROLE_LABELS[cap] || cap}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-zinc-600 mt-1">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Application Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selected.display_name}</CardTitle>
                      <div className="text-sm text-zinc-400 mt-1">{selected.email}</div>
                    </div>
                    <div className="flex gap-2">
                      {selected.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="flex items-center gap-1">
                          {ROLE_ICONS[cap]}
                          {ROLE_LABELS[cap] || cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-zinc-500" />
                      <span>{selected.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      <span>
                        {selected.address_city}, {selected.primary_county} {selected.address_zip}
                      </span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      Availability
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.available_weekdays && (
                        <Badge variant="outline">Weekdays</Badge>
                      )}
                      {selected.available_weekends && (
                        <Badge variant="outline">Weekends</Badge>
                      )}
                      {selected.available_nights && (
                        <Badge variant="outline">Evenings</Badge>
                      )}
                      {selected.available_immediately && (
                        <Badge variant="outline" className="bg-green-950/30 border-green-800">
                          On-call
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {selected.max_response_radius_miles} mi radius
                      </Badge>
                    </div>
                  </div>

                  {/* Transport Info */}
                  {selected.has_vehicle && (
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-zinc-500" />
                        Transport
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.vehicle_type && (
                          <Badge variant="outline">{selected.vehicle_type}</Badge>
                        )}
                        {selected.can_transport_crate && (
                          <Badge variant="outline">Can use crate</Badge>
                        )}
                        {selected.max_animal_size && (
                          <Badge variant="outline">Up to {selected.max_animal_size}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-500" />
                      Emergency Contact
                    </div>
                    <div className="text-sm text-zinc-400">
                      {selected.emergency_contact_name} — {selected.emergency_contact_phone}
                    </div>
                  </div>

                  {/* Background Check Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {selected.background_check_completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-400">Background check completed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-400">Background check pending</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {selected.status === "INACTIVE" && (
                    <div className="flex gap-3 pt-4 border-t border-zinc-800">
                      <Button
                        onClick={() => handleAction("approve", selected.id)}
                        disabled={actionLoading}
                        className="bg-green-700 hover:bg-green-600"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Approve & Activate
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction("reject", selected.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}

                  {selected.status === "ACTIVE" && (
                    <div className="pt-4 border-t border-zinc-800">
                      <Badge className="bg-green-900/50 text-green-300 border-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active Volunteer
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                Select an application to review
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
