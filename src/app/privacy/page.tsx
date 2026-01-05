import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <div className="text-white font-bold">Privacy Policy</div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">Privacy Policy</h1>
          <div className="space-y-4 text-slate-200 leading-relaxed">
            <p>
              This page describes how Pets 911 handles information.
            </p>
            <p>
              We aim to collect and use only what is necessary to provide the service. Where available, we prefer privacy-preserving
              defaults.
            </p>
            <p className="text-slate-300 text-sm">
              Note: This is a placeholder policy page intended to be user-facing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
