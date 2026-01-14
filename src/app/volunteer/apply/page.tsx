'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Shield, Truck, Home, Target, Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RoleId } from '@/lib/roles';
import { ROLE_DEFINITIONS, APPLICATION_REQUIREMENTS } from '@/lib/roles';

const VOLUNTEER_ROLES = [
  { id: 'moderator' as RoleId, icon: <Shield className="h-6 w-6" />, title: 'Moderator', desc: 'Case triage and match verification', commitment: '6+ hrs/week', color: 'blue' },
  { id: 'transporter' as RoleId, icon: <Truck className="h-6 w-6" />, title: 'Transporter', desc: 'Animal transport services', commitment: 'Flexible', color: 'green' },
  { id: 'emergency_foster' as RoleId, icon: <AlertTriangle className="h-6 w-6" />, title: 'Emergency Foster', desc: 'Short-term crisis foster (24-72hrs)', commitment: 'On-call', color: 'red' },
  { id: 'foster' as RoleId, icon: <Home className="h-6 w-6" />, title: 'Foster', desc: 'Temporary foster care', commitment: 'Days-weeks', color: 'amber' },
  { id: 'trapper' as RoleId, icon: <Target className="h-6 w-6" />, title: 'Humane Trapper', desc: 'TNR and lost pet recovery', commitment: 'Flexible', color: 'purple' },
  { id: 'community_volunteer' as RoleId, icon: <Users className="h-6 w-6" />, title: 'Community Volunteer', desc: 'Events and outreach', commitment: 'Flexible', color: 'teal' },
];

type Step = 'role' | 'personal' | 'details' | 'availability' | 'references' | 'agreements' | 'review';
const STEPS: Step[] = ['role', 'personal', 'details', 'availability', 'references', 'agreements', 'review'];

export default function VolunteerApplyPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<RoleId | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const idx = STEPS.indexOf(step);
  const next = () => idx < STEPS.length - 1 && setStep(STEPS[idx + 1]);
  const back = () => idx > 0 && setStep(STEPS[idx - 1]);
  const update = (section: string, data: any) => setForm(p => ({ ...p, [section]: { ...p[section], ...data } }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/helpers/join" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-semibold">Volunteer Application</h1>
          <span className="text-sm text-muted-foreground">Step {idx + 1}/{STEPS.length}</span>
        </div>
        <div className="h-1 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }} /></div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 'role' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Your Role</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {VOLUNTEER_ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)} className={`p-4 rounded-xl border-2 text-left ${role === r.id ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                  <div className="flex items-center gap-3 mb-2">{r.icon}<span className="font-semibold">{r.title}</span>{role === r.id && <Check className="h-4 w-4 ml-auto text-primary" />}</div>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                  <p className="text-xs text-muted-foreground mt-2"><Clock className="h-3 w-3 inline mr-1" />{r.commitment}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end"><Button onClick={next} disabled={!role}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </div>
        )}

        {step === 'personal' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Legal Name *" value={form.personal?.name} onChange={v => update('personal', { name: v })} />
              <Input label="Email *" type="email" value={form.personal?.email} onChange={v => update('personal', { email: v })} />
              <Input label="Phone *" type="tel" value={form.personal?.phone} onChange={v => update('personal', { phone: v })} />
              <Input label="Date of Birth *" type="date" value={form.personal?.dob} onChange={v => update('personal', { dob: v })} />
              <Input label="City *" value={form.personal?.city} onChange={v => update('personal', { city: v })} />
              <Input label="State *" value={form.personal?.state} onChange={v => update('personal', { state: v })} />
              <Input label="ZIP *" value={form.personal?.zip} onChange={v => update('personal', { zip: v })} />
              <Input label="County *" value={form.personal?.county} onChange={v => update('personal', { county: v })} />
            </div>
            <h3 className="font-semibold pt-4">Emergency Contact</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Input label="Name *" value={form.personal?.ecName} onChange={v => update('personal', { ecName: v })} />
              <Input label="Phone *" type="tel" value={form.personal?.ecPhone} onChange={v => update('personal', { ecPhone: v })} />
              <Input label="Relationship *" value={form.personal?.ecRelation} onChange={v => update('personal', { ecRelation: v })} />
            </div>
            <Nav onBack={back} onNext={next} />
          </div>
        )}

        {step === 'details' && role && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{ROLE_DEFINITIONS[role]?.name} Details</h2>
            {['transporter', 'senior_transporter'].includes(role) && (
              <div className="grid md:grid-cols-2 gap-4">
                <Select label="Vehicle Type *" value={form.details?.vehicle} onChange={v => update('details', { vehicle: v })} options={['sedan', 'suv', 'truck', 'van']} />
                <Select label="Max Animal Size" value={form.details?.maxSize} onChange={v => update('details', { maxSize: v })} options={['small', 'medium', 'large', 'xlarge']} />
                <Input label="Max Distance (miles)" type="number" value={form.details?.maxDist} onChange={v => update('details', { maxDist: v })} />
                <Checkbox label="I have a carrier/crate" checked={form.details?.hasCrate} onChange={v => update('details', { hasCrate: v })} />
              </div>
            )}
            {['foster', 'emergency_foster'].includes(role) && (
              <div className="grid md:grid-cols-2 gap-4">
                <Select label="Home Type *" value={form.details?.homeType} onChange={v => update('details', { homeType: v })} options={['house', 'apartment', 'condo', 'farm']} />
                <Input label="Max Foster Count" type="number" value={form.details?.maxFoster} onChange={v => update('details', { maxFoster: v })} />
                <Checkbox label="I have a fenced yard" checked={form.details?.fenced} onChange={v => update('details', { fenced: v })} />
                <Checkbox label="I have other pets" checked={form.details?.otherPets} onChange={v => update('details', { otherPets: v })} />
              </div>
            )}
            {role === 'trapper' && (
              <div className="space-y-4">
                <Textarea label="Trapping Experience *" value={form.details?.experience} onChange={v => update('details', { experience: v })} />
                <Checkbox label="I own humane traps" checked={form.details?.ownTraps} onChange={v => update('details', { ownTraps: v })} />
                <Checkbox label="I am TNR certified" checked={form.details?.tnrCert} onChange={v => update('details', { tnrCert: v })} />
              </div>
            )}
            {['moderator', 'junior_moderator', 'lead_moderator'].includes(role) && (
              <div className="space-y-4">
                <Textarea label="Relevant Experience *" value={form.details?.experience} onChange={v => update('details', { experience: v })} />
                <Input label="Hours Available/Week *" type="number" value={form.details?.hours} onChange={v => update('details', { hours: v })} />
              </div>
            )}
            <Textarea label="Why do you want to volunteer? *" value={form.details?.why} onChange={v => update('details', { why: v })} />
            <Nav onBack={back} onNext={next} />
          </div>
        )}

        {step === 'availability' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Availability</h2>
            <div>
              <p className="text-sm font-medium mb-2">Days Available *</p>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <label key={d} className={`px-3 py-1 rounded cursor-pointer ${(form.availability?.days || []).includes(d) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <input type="checkbox" className="sr-only" checked={(form.availability?.days || []).includes(d)} onChange={e => {
                      const days = form.availability?.days || [];
                      update('availability', { days: e.target.checked ? [...days, d] : days.filter((x: string) => x !== d) });
                    }} />{d}
                  </label>
                ))}
              </div>
            </div>
            <Input label="Max Travel Radius (miles) *" type="number" value={form.availability?.radius} onChange={v => update('availability', { radius: v })} />
            <Checkbox label="Can respond within 30 min for emergencies" checked={form.availability?.fast} onChange={v => update('availability', { fast: v })} />
            <Nav onBack={back} onNext={next} />
          </div>
        )}

        {step === 'references' && role && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">References</h2>
            {APPLICATION_REQUIREMENTS[role]?.minimumReferences === 0 ? (
              <div className="text-center py-8"><CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" /><p>No references required for this role.</p></div>
            ) : (
              Array.from({ length: APPLICATION_REQUIREMENTS[role]?.minimumReferences || 1 }).map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                  <p className="font-medium">Reference {i + 1}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input label="Name *" value={form.refs?.[i]?.name} onChange={v => { const refs = [...(form.refs || [])]; refs[i] = { ...refs[i], name: v }; setForm(p => ({ ...p, refs })); }} />
                    <Input label="Phone *" value={form.refs?.[i]?.phone} onChange={v => { const refs = [...(form.refs || [])]; refs[i] = { ...refs[i], phone: v }; setForm(p => ({ ...p, refs })); }} />
                    <Input label="Relationship *" value={form.refs?.[i]?.rel} onChange={v => { const refs = [...(form.refs || [])]; refs[i] = { ...refs[i], rel: v }; setForm(p => ({ ...p, refs })); }} />
                    <Input label="Email" value={form.refs?.[i]?.email} onChange={v => { const refs = [...(form.refs || [])]; refs[i] = { ...refs[i], email: v }; setForm(p => ({ ...p, refs })); }} />
                  </div>
                </div>
              ))
            )}
            <Nav onBack={back} onNext={next} />
          </div>
        )}

        {step === 'agreements' && role && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Agreements</h2>
            <Agreement label="Code of Conduct *" desc="I agree to abide by the Mayday Volunteer Code of Conduct." checked={form.agree?.code} onChange={v => update('agree', { code: v })} />
            <Agreement label="Terms of Service *" desc="I agree to the Terms of Service and Privacy Policy." checked={form.agree?.terms} onChange={v => update('agree', { terms: v })} />
            {APPLICATION_REQUIREMENTS[role]?.requiresBackgroundCheck && (
              <Agreement label="Background Check *" desc="I authorize a background check as part of my application." checked={form.agree?.bg} onChange={v => update('agree', { bg: v })} />
            )}
            <Agreement label="Confidentiality" desc="I will keep volunteer information confidential." checked={form.agree?.conf} onChange={v => update('agree', { conf: v })} />
            <Nav onBack={back} onNext={next} disabled={!form.agree?.code || !form.agree?.terms || (APPLICATION_REQUIREMENTS[role]?.requiresBackgroundCheck && !form.agree?.bg)} />
          </div>
        )}

        {step === 'review' && role && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review & Submit</h2>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{ROLE_DEFINITIONS[role]?.name}</p>
              <p className="text-sm text-muted-foreground">{form.personal?.name} • {form.personal?.email}</p>
            </div>
            <div className="p-4 border border-blue-500/30 bg-blue-500/10 rounded-lg">
              <p className="font-semibold text-blue-400">What Happens Next</p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>Application reviewed ({APPLICATION_REQUIREMENTS[role]?.estimatedProcessingDays || 7} days)</li>
                {APPLICATION_REQUIREMENTS[role]?.requiresBackgroundCheck && <li>Background check initiated</li>}
                {APPLICATION_REQUIREMENTS[role]?.requiresInterview && <li>Interview scheduled</li>}
                <li>Training modules assigned</li>
                <li>Welcome to the team!</li>
              </ol>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              <Button onClick={() => { console.log('Submit:', { role, ...form }); alert('Application submitted!'); }}>Submit Application</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
const Input = ({ label, type = 'text', value, onChange }: { label: string; type?: string; value?: string; onChange: (v: string) => void }) => (
  <div><label className="block text-sm font-medium mb-1">{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background" /></div>
);
const Textarea = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
  <div><label className="block text-sm font-medium mb-1">{label}</label><textarea value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[80px]" /></div>
);
const Select = ({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: string[] }) => (
  <div><label className="block text-sm font-medium mb-1">{label}</label><select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background"><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
);
const Checkbox = ({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2"><input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)} className="h-4 w-4" /><span className="text-sm">{label}</span></label>
);
const Agreement = ({ label, desc, checked, onChange }: { label: string; desc: string; checked?: boolean; onChange: (v: boolean) => void }) => (
  <div className="p-4 border border-border rounded-lg"><label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)} className="h-5 w-5 mt-0.5" /><div><p className="font-medium">{label}</p><p className="text-sm text-muted-foreground">{desc}</p></div></label></div>
);
const Nav = ({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled?: boolean }) => (
  <div className="flex justify-between pt-4"><Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><Button onClick={onNext} disabled={disabled}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
);
