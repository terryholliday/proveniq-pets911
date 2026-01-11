"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  userId: string;
  email: string | null;
};

type County = "GREENBRIER" | "KANAWHA";

type FormState = {
  displayName: string;
  phone: string;
  primaryCounty: County | "";
  addressCity: string;
  addressZip: string;
  capabilities: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
};

const CAPABILITY_OPTIONS: { id: string; label: string }[] = [
  { id: "COMMUNITY_VOLUNTEER", label: "Community Volunteer" },
  { id: "TRANSPORT", label: "Transport" },
  { id: "FOSTER", label: "Foster" },
  { id: "EMERGENCY_FOSTER", label: "Emergency Foster" },
  { id: "TRAP", label: "Trap" },
  { id: "MODERATOR", label: "Moderator" },
];

export default function ApplyForm({ userId, email }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    displayName: "",
    phone: "",
    primaryCounty: "",
    addressCity: "",
    addressZip: "",
    capabilities: [],
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error: loadError } = await supabase
        .from("volunteers")
        .select(
          "display_name, phone, primary_county, address_city, address_zip, capabilities, emergency_contact_name, emergency_contact_phone"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (loadError && loadError.code !== "PGRST116") {
        setError(loadError.message);
      }

      if (data) {
        setForm({
          displayName: data.display_name ?? "",
          phone: data.phone ?? "",
          primaryCounty: (data.primary_county as County) ?? "",
          addressCity: data.address_city ?? "",
          addressZip: data.address_zip ?? "",
          capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
          emergencyContactName: data.emergency_contact_name ?? "",
          emergencyContactPhone: data.emergency_contact_phone ?? "",
        });
      }

      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  const toggleCapability = (id: string) => {
    setForm((prev) => {
      const exists = prev.capabilities.includes(id);
      return {
        ...prev,
        capabilities: exists ? prev.capabilities.filter((c) => c !== id) : [...prev.capabilities, id],
      };
    });
  };

  const canSubmit =
    form.displayName.trim() &&
    form.phone.trim() &&
    form.primaryCounty &&
    form.addressCity.trim() &&
    form.addressZip.trim() &&
    form.capabilities.length > 0 &&
    form.emergencyContactName.trim() &&
    form.emergencyContactPhone.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: existing, error: existingError } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        throw existingError;
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("volunteers")
          .update({
            display_name: form.displayName,
            phone: form.phone,
            email: email,
            primary_county: form.primaryCounty,
            address_city: form.addressCity,
            address_zip: form.addressZip,
            capabilities: form.capabilities,
            emergency_contact_name: form.emergencyContactName,
            emergency_contact_phone: form.emergencyContactPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("volunteers").insert({
          user_id: userId,
          status: "INACTIVE",
          display_name: form.displayName,
          phone: form.phone,
          email: email,
          primary_county: form.primaryCounty,
          address_city: form.addressCity,
          address_zip: form.addressZip,
          capabilities: form.capabilities,
          emergency_contact_name: form.emergencyContactName,
          emergency_contact_phone: form.emergencyContactPhone,
          last_active_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;
      }

      setSuccess("Application saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="font-mono text-sm">{email ?? "(no email)"}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm font-medium">Display name</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Phone</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Primary county</div>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.primaryCounty}
            onChange={(e) => setForm((p) => ({ ...p, primaryCounty: e.target.value as County }))}
            required
          >
            <option value="" disabled>
              Select…
            </option>
            <option value="GREENBRIER">GREENBRIER</option>
            <option value="KANAWHA">KANAWHA</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">City</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.addressCity}
            onChange={(e) => setForm((p) => ({ ...p, addressCity: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">ZIP</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.addressZip}
            onChange={(e) => setForm((p) => ({ ...p, addressZip: e.target.value }))}
            required
          />
        </label>

        <div className="space-y-2">
          <div className="text-sm font-medium">Requested authorities</div>
          <div className="grid grid-cols-1 gap-2">
            {CAPABILITY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.capabilities.includes(opt.id)}
                  onChange={() => toggleCapability(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Emergency contact name</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.emergencyContactName}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Emergency contact phone</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.emergencyContactPhone}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
            required
          />
        </label>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {success && <div className="text-sm text-teal">{success}</div>}

      <div className="flex gap-3">
        <Button type="submit" disabled={!canSubmit || saving}>
          {saving ? "Saving…" : "Save Application"}
        </Button>
      </div>
    </form>
  );
}
