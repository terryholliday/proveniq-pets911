import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AppStoreSafetyPage() {
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
            <ShieldCheck className="w-5 h-5 text-green-400" />
            App Safety Information
          </div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">App Safety Information</h1>

          <div className="space-y-6 text-slate-200 leading-relaxed">
            <p>
              petmayday provides emotional support and general guidance related to pets during stressful situations such as loss, emergencies, or uncertainty.
            </p>

            <div className="p-5 rounded-xl bg-slate-950 border border-red-900/40">
              <h2 className="text-xl font-bold text-white mb-2">Important Safety Information</h2>
              <ul className="space-y-2">
                <li>• petmayday does <strong>not</strong> provide medical, veterinary, or mental health diagnoses.</li>
                <li>• Pet11 does <strong>not</strong> replace licensed professionals or emergency services.</li>
                <li>• If you or your pet are in immediate danger, contact local emergency services.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Crisis Support</h2>
              <p>
                If you are experiencing thoughts of self-harm or severe emotional distress, please seek immediate help from trained professionals.
              </p>
              <p className="mt-2">In the U.S.:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>988 – Suicide & Crisis Lifeline</strong> (call or text)</li>
              </ul>
              <p className="mt-2">
                petmayday may encourage users to seek professional help when appropriate.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Intended Use</h2>
              <p>
                petmayday is intended as a <strong>supportive informational tool</strong> only. Always consult qualified professionals for medical or mental health concerns.
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
                href="/help/safety"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Help & Safety
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
