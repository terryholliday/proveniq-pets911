import Link from 'next/link';
import { ArrowLeft, Newspaper } from 'lucide-react';

export default function PressPage() {
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
            <Newspaper className="w-5 h-5 text-blue-400" />
            Press Information
          </div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">What Is Mayday?</h1>

          <div className="space-y-6 text-slate-200 leading-relaxed">
            <p>
              Mayday is a digital support service designed to help people navigate emotionally intense moments involving pets—such as emergencies, loss, or difficult decisions—without replacing professional care.
            </p>

            <p>
              For many people, pets are family. When something goes wrong, panic and grief can overwhelm even the most prepared pet owner. Mayday aims to provide calm, compassionate guidance and encourage appropriate next steps.
            </p>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">How It Works (High-Level)</h2>
              <p>
                Mayday responds to user input with supportive language and practical guidance based on established principles of trauma-informed support and grief awareness.
              </p>
              <p className="mt-2">
                When situations appear serious or unsafe, Mayday encourages users to seek help from trained professionals or emergency services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">What Mayday Is — and Is Not</h2>
              <p>
                <strong>It is:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>A support companion</li>
                <li>A calming presence during stressful moments</li>
                <li>A guide toward appropriate resources</li>
              </ul>
              <p className="mt-3">
                <strong>It is not:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>A veterinarian</li>
                <li>A therapist</li>
                <li>A replacement for emergency care</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Why Mayday Was Created</h2>
              <p>
                Pet-related crises are often minimized by society, even though research shows pet loss and emergencies can trigger grief responses similar to human loss.
              </p>
              <p className="mt-2">
                Mayday was built to acknowledge that pain—without judgment—and to help people feel less alone during moments that can otherwise feel overwhelming.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Safety First</h2>
              <p>
                Mayday is intentionally designed to prioritize safety and to encourage human support whenever a situation exceeds what an automated tool should handle.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Ethical Design</h2>
              <p>
                The creators of Mayday emphasize:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Responsible use of AI</li>
                <li>Clear boundaries around medical and mental health support</li>
                <li>Transparency about limitations</li>
                <li>Encouraging human connection when needed</li>
              </ul>
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
                href="/app-store-safety"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                App Safety Info
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
