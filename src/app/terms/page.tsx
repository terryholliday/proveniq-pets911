import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <div className="text-white font-bold">Terms of Service</div>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">Terms of Service</h1>
          <div className="space-y-4 text-slate-200 leading-relaxed">
            <p>
              <strong>Mayday – Terms of Service (Safety & Use)</strong>
            </p>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Purpose of the Service</h2>
                <p>
                  Mayday is an informational and emotional support service designed to assist users during stressful situations involving pets, including loss, emergencies, and uncertainty.
                </p>
                <p className="mt-2">
                  Mayday does <strong>not</strong> provide medical, veterinary, psychological, or legal advice.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">Not a Substitute for Professional Care</h2>
                <p>
                  Mayday is <strong>not a replacement</strong> for:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Licensed veterinarians</li>
                  <li>Medical professionals</li>
                  <li>Mental health providers</li>
                  <li>Emergency services</li>
                </ul>
                <p className="mt-2">
                  If your pet is injured, unresponsive, or in danger, or if you feel unsafe or overwhelmed, you should contact appropriate professionals or emergency services immediately.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">Crisis & Safety Escalation</h2>
                <p>
                  Mayday may encourage users to seek immediate professional or emergency assistance when a situation appears to involve serious risk or distress.
                </p>
                <p className="mt-2">
                  Mayday does not monitor users in real time and cannot guarantee detection of emergencies or crises.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">No Guarantees</h2>
                <p>
                  Mayday is provided "as is." We make no guarantees regarding:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Accuracy</li>
                  <li>Completeness</li>
                  <li>Timeliness</li>
                  <li>Suitability for any specific purpose</li>
                </ul>
                <p className="mt-2">
                  Use of the service is at your own discretion.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Mayday and its operators are not liable for any damages resulting from reliance on information provided through the service.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">User Responsibility</h2>
                <p>
                  You remain responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Decisions made regarding your pet</li>
                  <li>Seeking appropriate professional care</li>
                  <li>Your personal safety and well-being</li>
                </ul>
                <p className="mt-2">
                  Mayday is a support tool, not a decision-maker.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">A Note on Compassion</h2>
                <p>
                  Mayday was created to support people during difficult moments. Nothing in these terms is intended to minimize grief or emotional pain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
