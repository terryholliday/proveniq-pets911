"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Shield, Truck, Home, AlertTriangle } from "lucide-react";
import { WV_COUNTIES, type WVCounty, ACTIVE_DISPATCH_COUNTIES, formatCountyName } from "@/lib/constants/counties";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  email: string | null;
};

type RoleOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  priority: number;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "MODERATOR",
    label: "Moderator",
    description: "Review dispatch requests, coordinate volunteers, manage the queue. Requires training and background check.",
    icon: <Shield className="h-6 w-6" />,
    priority: 1,
  },
  {
    id: "TRANSPORT",
    label: "Transport Volunteer",
    description: "Transport animals to vets, shelters, or foster homes. Requires vehicle and valid license.",
    icon: <Truck className="h-6 w-6" />,
    priority: 2,
  },
  {
    id: "FOSTER",
    label: "Foster Care",
    description: "Provide temporary home for animals in need. Short-term or long-term options available.",
    icon: <Home className="h-6 w-6" />,
    priority: 3,
  },
  {
    id: "EMERGENCY_RESPONSE",
    label: "Emergency Response",
    description: "Respond to urgent animal emergencies. On-call availability required.",
    icon: <AlertTriangle className="h-6 w-6" />,
    priority: 4,
  },
];

type FormData = {
  selectedRole: string;
  displayName: string;
  phone: string;
  primaryCounty: WVCounty | "";
  addressCity: string;
  addressZip: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  hasVehicle: boolean;
  vehicleType: string;
  canTransportCrate: boolean;
  maxAnimalSize: "SMALL" | "MEDIUM" | "LARGE" | "XLARGE" | "";
  availableWeekdays: boolean;
  availableWeekends: boolean;
  availableNights: boolean;
  availableImmediately: boolean;
  maxResponseRadius: number;
  agreeCodeOfConduct: boolean;
  agreeBackgroundCheck: boolean;
  agreeTermsOfService: boolean;
  agreeLiabilityWaiver: boolean;
  experienceDescription: string;
  whyVolunteer: string;
};

const INITIAL_FORM: FormData = {
  selectedRole: "",
  displayName: "",
  phone: "",
  primaryCounty: "",
  addressCity: "",
  addressZip: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  hasVehicle: false,
  vehicleType: "",
  canTransportCrate: false,
  maxAnimalSize: "",
  availableWeekdays: false,
  availableWeekends: false,
  availableNights: false,
  availableImmediately: false,
  maxResponseRadius: 15,
  agreeCodeOfConduct: false,
  agreeBackgroundCheck: false,
  agreeTermsOfService: false,
  agreeLiabilityWaiver: false,
  experienceDescription: "",
  whyVolunteer: "",
};

const STEPS = [
  { id: "role", title: "Select Role" },
  { id: "personal", title: "Personal Info" },
  { id: "availability", title: "Availability" },
  { id: "agreements", title: "Agreements" },
  { id: "review", title: "Review & Submit" },
];

export default function MultiStepApplyForm({ userId, email }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!form.selectedRole;
      case 1:
        return !!(
          form.displayName.trim() &&
          form.phone.trim() &&
          form.primaryCounty &&
          form.addressCity.trim() &&
          form.addressZip.trim() &&
          form.emergencyContactName.trim() &&
          form.emergencyContactPhone.trim()
        );
      case 2:
        return form.availableWeekdays || form.availableWeekends || form.availableNights;
      case 3:
        return (
          form.agreeCodeOfConduct &&
          form.agreeBackgroundCheck &&
          form.agreeTermsOfService &&
          form.agreeLiabilityWaiver
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Get the current session access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const res = await fetch("/api/volunteer/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          display_name: form.displayName,
          phone: form.phone,
          primary_county: form.primaryCounty,
          address_city: form.addressCity,
          address_zip: form.addressZip,
          capabilities: [form.selectedRole],
          emergency_contact_name: form.emergencyContactName,
          emergency_contact_phone: form.emergencyContactPhone,
          emergency_contact_relation: form.emergencyContactRelation,
          has_vehicle: form.hasVehicle,
          vehicle_type: form.vehicleType || null,
          can_transport_crate: form.canTransportCrate,
          max_animal_size: form.maxAnimalSize || null,
          available_weekdays: form.availableWeekdays,
          available_weekends: form.availableWeekends,
          available_nights: form.availableNights,
          available_immediately: form.availableImmediately,
          max_response_radius_miles: form.maxResponseRadius,
          application_meta: {
            agreed_code_of_conduct_at: form.agreeCodeOfConduct ? new Date().toISOString() : null,
            agreed_background_check_at: form.agreeBackgroundCheck ? new Date().toISOString() : null,
            agreed_terms_at: form.agreeTermsOfService ? new Date().toISOString() : null,
            agreed_liability_at: form.agreeLiabilityWaiver ? new Date().toISOString() : null,
            experience_description: form.experienceDescription,
            why_volunteer: form.whyVolunteer,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Application Submitted!</h2>
          <p className="text-muted-foreground">
            Thank you for applying to volunteer with Pet911. Your application is now pending review.
            You will be contacted once a decision has been made.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? Contact <a href="mailto:terry@proveniq.io" className="underline">terry@proveniq.io</a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                i < step
                  ? "bg-green-600 text-white"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 ${i < step ? "bg-green-600" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>
            {step === 0 && "Choose the primary role you'd like to apply for"}
            {step === 1 && "Tell us about yourself"}
            {step === 2 && "When are you available to help?"}
            {step === 3 && "Please review and agree to our policies"}
            {step === 4 && "Review your application before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <div className="grid gap-4">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => updateForm("selectedRole", role.id)}
                  className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-colors ${
                    form.selectedRole === role.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      form.selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{role.label}</div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                  </div>
                  {form.selectedRole === role.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="grid gap-4">
              <div className="text-sm text-muted-foreground mb-2">
                Signed in as <span className="font-mono">{email}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <div className="text-sm font-medium">Display Name *</div>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.displayName}
                    onChange={(e) => updateForm("displayName", e.target.value)}
                    placeholder="How you'd like to be called"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium">Phone *</div>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="304-555-1234"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium">Primary County *</div>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.primaryCounty}
                    onChange={(e) => updateForm("primaryCounty", e.target.value as WVCounty)}
                  >
                    <option value="">Select county…</option>
                    {WV_COUNTIES.map((county) => (
                      <option key={county} value={county}>
                        {formatCountyName(county)} County
                        {ACTIVE_DISPATCH_COUNTIES.includes(county) ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground mt-1">
                    ★ = Active dispatch area
                  </div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium">City *</div>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.addressCity}
                    onChange={(e) => updateForm("addressCity", e.target.value)}
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium">ZIP Code *</div>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.addressZip}
                    onChange={(e) => updateForm("addressZip", e.target.value)}
                    maxLength={10}
                  />
                </label>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="text-sm font-medium mb-3">Emergency Contact</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Name *</div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.emergencyContactName}
                      onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Phone *</div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.emergencyContactPhone}
                      onChange={(e) => updateForm("emergencyContactPhone", e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Relationship</div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.emergencyContactRelation}
                      onChange={(e) => updateForm("emergencyContactRelation", e.target.value)}
                      placeholder="Spouse, Parent, etc."
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Availability */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-3">When are you available? *</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "availableWeekdays", label: "Weekdays (Mon-Fri)" },
                    { key: "availableWeekends", label: "Weekends (Sat-Sun)" },
                    { key: "availableNights", label: "Evenings (after 6pm)" },
                    { key: "availableImmediately", label: "On-call (respond within 30 min)" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form[key as keyof FormData] as boolean}
                        onChange={(e) => updateForm(key as keyof FormData, e.target.checked as never)}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="space-y-1">
                  <div className="text-sm font-medium">Maximum response radius (miles)</div>
                  <input
                    type="number"
                    className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.maxResponseRadius}
                    onChange={(e) => updateForm("maxResponseRadius", parseInt(e.target.value) || 0)}
                    min={1}
                    max={100}
                  />
                </label>
              </div>

              {(form.selectedRole === "TRANSPORT" || form.selectedRole === "EMERGENCY_RESPONSE") && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Transport Capabilities</div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.hasVehicle}
                        onChange={(e) => updateForm("hasVehicle", e.target.checked)}
                        className="rounded"
                      />
                      I have a vehicle available for transport
                    </label>

                    {form.hasVehicle && (
                      <>
                        <label className="space-y-1 block">
                          <div className="text-sm text-muted-foreground">Vehicle type</div>
                          <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={form.vehicleType}
                            onChange={(e) => updateForm("vehicleType", e.target.value)}
                          >
                            <option value="">Select…</option>
                            <option value="sedan">Sedan</option>
                            <option value="suv">SUV</option>
                            <option value="truck">Truck</option>
                            <option value="van">Van</option>
                          </select>
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.canTransportCrate}
                            onChange={(e) => updateForm("canTransportCrate", e.target.checked)}
                            className="rounded"
                          />
                          Can transport animals in crates
                        </label>

                        <label className="space-y-1 block">
                          <div className="text-sm text-muted-foreground">Maximum animal size</div>
                          <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={form.maxAnimalSize}
                            onChange={(e) => updateForm("maxAnimalSize", e.target.value as FormData["maxAnimalSize"])}
                          >
                            <option value="">Select…</option>
                            <option value="SMALL">Small (under 20 lbs)</option>
                            <option value="MEDIUM">Medium (20-50 lbs)</option>
                            <option value="LARGE">Large (50-100 lbs)</option>
                            <option value="XLARGE">X-Large (over 100 lbs)</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="space-y-1">
                  <div className="text-sm font-medium">Relevant experience (optional)</div>
                  <textarea
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                    value={form.experienceDescription}
                    onChange={(e) => updateForm("experienceDescription", e.target.value)}
                    placeholder="Tell us about any relevant volunteer, animal handling, or professional experience..."
                  />
                </label>
              </div>

              <div>
                <label className="space-y-1">
                  <div className="text-sm font-medium">Why do you want to volunteer?</div>
                  <textarea
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                    value={form.whyVolunteer}
                    onChange={(e) => updateForm("whyVolunteer", e.target.value)}
                    placeholder="What motivates you to help animals in need?"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Agreements */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please read and agree to each of the following to continue:
              </p>

              {[
                {
                  key: "agreeCodeOfConduct",
                  label: "Code of Conduct",
                  description:
                    "I agree to conduct myself professionally, treat animals humanely, and follow all Pet911 policies and procedures.",
                },
                {
                  key: "agreeBackgroundCheck",
                  label: "Background Check Consent",
                  description:
                    "I consent to a background check being performed as part of my application. I understand this is required for volunteer roles.",
                },
                {
                  key: "agreeTermsOfService",
                  label: "Terms of Service",
                  description:
                    "I have read and agree to the Pet911 Terms of Service and understand my responsibilities as a volunteer.",
                },
                {
                  key: "agreeLiabilityWaiver",
                  label: "Liability Waiver",
                  description:
                    "I understand that volunteering involves inherent risks and I release Pet911 and its affiliates from liability for any injuries sustained while volunteering.",
                },
              ].map(({ key, label, description }) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    form[key as keyof FormData] ? "border-green-600 bg-green-50 dark:bg-green-950/20" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[key as keyof FormData] as boolean}
                    onChange={(e) => updateForm(key as keyof FormData, e.target.checked as never)}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium">
                    {ROLE_OPTIONS.find((r) => r.id === form.selectedRole)?.label}
                  </div>

                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{form.displayName}</div>

                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{email}</div>

                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{form.phone}</div>

                  <div className="text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {form.addressCity}, {form.primaryCounty} {form.addressZip}
                  </div>

                  <div className="text-muted-foreground">Availability</div>
                  <div className="font-medium">
                    {[
                      form.availableWeekdays && "Weekdays",
                      form.availableWeekends && "Weekends",
                      form.availableNights && "Evenings",
                      form.availableImmediately && "On-call",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>

                  <div className="text-muted-foreground">Response radius</div>
                  <div className="font-medium">{form.maxResponseRadius} miles</div>

                  <div className="text-muted-foreground">Emergency Contact</div>
                  <div className="font-medium">
                    {form.emergencyContactName} ({form.emergencyContactPhone})
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                By clicking Submit, your application will be sent to the Pet911 team for review.
                You will be notified once a decision has been made.
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting || !canProceed()}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
