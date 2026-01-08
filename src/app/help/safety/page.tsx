import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function HelpSafetyPage() {
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
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Help &amp; Safety
          </div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">Help &amp; Safety</h1>

          <div className="space-y-8 text-slate-200 leading-relaxed">
            <div className="p-5 rounded-xl bg-slate-950 border border-red-900/40">
              <h2 className="text-xl font-bold text-white mb-2">If You’re in Immediate Danger</h2>
              <p className="text-slate-200">
                If you or someone else may be in immediate danger, please contact local emergency services right away.
              </p>
              <p className="text-slate-200 mt-3">
                If you are in the United States and experiencing thoughts of self-harm or overwhelming distress, you can contact:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>988</strong> – Suicide &amp; Crisis Lifeline (call or text, 24/7)</li>
                <li>Local emergency services (911)</li>
              </ul>
              <p className="text-slate-300 text-sm mt-4">
                Pet911 will always encourage reaching out to trained human professionals when safety is at risk.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">How Pet911 Supports You</h2>
              <p>
                Pet911 provides emotional support and practical guidance related to pets and the intense feelings that can come with
                pet emergencies, loss, or grief.
              </p>
              <p className="mt-3">The system is designed to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Respond calmly and compassionately</li>
                <li>Encourage healthy coping and grounding</li>
                <li>Offer practical next steps when appropriate</li>
                <li>Recommend professional help when a situation requires it</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">When to Seek Professional Help</h2>
              <p>Please reach out to a veterinarian, medical professional, or mental health provider if:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Your pet is injured, unresponsive, or in medical distress</li>
                <li>You feel unable to care for yourself</li>
                <li>Your emotions feel unmanageable or unsafe</li>
                <li>You’re unsure whether a situation is urgent</li>
              </ul>
              <p className="mt-3">Asking for help is a sign of strength, not failure.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Privacy &amp; Respect</h2>
              <p>
                Pet911 is designed to treat every interaction with care and respect. Conversations are intended to provide
                support—not judgment—and to prioritize your safety and well-being.
              </p>
              <p className="mt-3">
                If you ever feel that Pet911 is not enough, that’s okay. Human help is always the right next step.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                About
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Support Companion
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
