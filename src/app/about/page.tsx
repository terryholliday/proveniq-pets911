import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <header className="px-6 py-6 bg-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-white font-bold">
            <Heart className="w-5 h-5 text-red-500" />
            Pets 911
          </div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">About Pets 911</h1>

          <div className="space-y-6 text-slate-200 leading-relaxed">
            <p>
              Pets 911 exists to support people during some of the most emotionally intense moments of pet ownership—when a pet is
              missing, injured, dying, or has passed away.
            </p>

            <p>
              For many people, pets are family. Losing them, worrying about them, or facing difficult decisions about their care can
              bring overwhelming grief, fear, and confusion. Pets 911 was created to help people feel less alone in those moments and
              to provide calm, compassionate guidance when it matters most.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">Safety Comes First</h2>
            <p>
              Pets 911 is designed with safety as its highest priority. When conversations indicate severe emotional distress or
              potential risk to personal safety, the system encourages reaching out to trained human support resources. Pets 911 does
              not attempt to replace professional care and will always point users toward appropriate help when a situation goes beyond
              what an automated system should handle.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">What Pets 911 Can Help With</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Emotional support during pet loss or grief</li>
              <li>Guidance when a pet is missing or found</li>
              <li>Support during difficult quality-of-life decisions</li>
              <li>Help navigating panic, shock, or overwhelming emotions</li>
              <li>Encouragement to seek professional or emergency help when needed</li>
            </ul>

            <h2 className="text-xl font-bold text-white pt-2">What Pets 911 Is Not</h2>
            <p>
              Pets 911 does not provide medical, veterinary, or mental health diagnoses. It does not replace veterinarians, doctors,
              therapists, or emergency services. It is a support tool—not a substitute for professional care.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">Built With Care</h2>
            <p>
              Pets 911 was designed using established principles from grief research and trauma-informed support. The goal is not to
              rush grief or minimize pain, but to meet people where they are—with respect, clarity, and compassion.
            </p>

            <p className="text-slate-100">
              If you’re here because you’re struggling, you’re not weak. You’re human. Pets 911 is here to support you through it.
            </p>
          </div>

          <div className="mt-10 p-5 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="text-white font-semibold mb-2">If you’re in crisis</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              If you or someone else may be in immediate danger, contact local emergency services.
              {' '}If you are in the United States and experiencing thoughts of self-harm or overwhelming distress, you can call or text
              {' '}<strong>988</strong> (Suicide &amp; Crisis Lifeline).
            </p>
            <div className="mt-3">
              <Link
                href="/help/safety"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Help &amp; Safety →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
