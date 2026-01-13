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

            <section className="px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto space-y-16">
                    {/* Header */}
                    <div className="border-b border-slate-800 pb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-mono font-medium border border-red-500/20">
                                CANONICAL_LAW
                            </span>
                            <span className="text-slate-500 text-xs font-mono">
                                VERSION 1.0.0
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                            Data Protection &<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500">
                                Fail-Closed Privacy.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
                            We are building a "Truth Layer" for pet identity, not a marketing database.
                            Our systems are designed to <span className="text-white font-medium">protect users from predation</span> while enabling rapid emergency response.
                        </p>
                    </div>

                    {/* Core Doctrine */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-3">The "Fail-Closed" Doctrine</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Our platform operates on a "Fail-Closed" permissions model. This means that if `SYSTEM_STATUS` is ambiguous or consent is unclear,
                                data is <strong>never shared</strong>. We protect the privacy of the Finder and the Owner above all else to prevent extortion and harassment.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-3">No Commercial Surveillance</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                PetMayday explicitly replaces "rent-seeking" registries. We do not sell your data, we do not scrape social media, and we do not
                                use "panic" to upsell services. We are an operational utility for emergency coordination.
                            </p>
                        </div>
                    </div>

                    {/* The Access Matrix */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Who Sees What? (Access Control Matrix)</h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Data Entity</th>
                                        <th className="px-6 py-4">Public User</th>
                                        <th className="px-6 py-4">Finder/Owner</th>
                                        <th className="px-6 py-4">Verified Moderator</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                    <tr className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Contact Info (Phone/Email)</td>
                                        <td className="px-6 py-4"><span className="text-red-500 font-mono">NEVER</span></td>
                                        <td className="px-6 py-4">Own Only</td>
                                        <td className="px-6 py-4 text-yellow-500">Audit-Logged Access*</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Exact Location (Home)</td>
                                        <td className="px-6 py-4"><span className="text-red-500 font-mono">REDACTED</span></td>
                                        <td className="px-6 py-4">Own Only</td>
                                        <td className="px-6 py-4 text-teal-400">Authorized</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Approximate Area</td>
                                        <td className="px-6 py-4 text-teal-400">Visible</td>
                                        <td className="px-6 py-4 text-teal-400">Visible</td>
                                        <td className="px-6 py-4 text-teal-400">Visible</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Pet Medical Data</td>
                                        <td className="px-6 py-4"><span className="text-red-500 font-mono">NEVER</span></td>
                                        <td className="px-6 py-4">Own Only</td>
                                        <td className="px-6 py-4 text-yellow-500">Audit-Logged Access</td>
                                    </tr>
                                    <tr className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Match Suggestions</td>
                                        <td className="px-6 py-4"><span className="text-red-500 font-mono">NEVER</span></td>
                                        <td className="px-6 py-4">If Confirmed</td>
                                        <td className="px-6 py-4 text-teal-400">Visible</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 ml-1">
                            * Moderators must explicitly log a reason for accessing contact information. This action generates an immutable audit log entry.
                        </p>
                    </div>

                    {/* The Contact Gate */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">The "Contact Gate" Protocol</h2>
                            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 text-xs font-mono border border-teal-500/20">INVARIANT: CONTACT_GATED</span>
                        </div>
                        <p className="text-slate-400 mb-6">
                            To prevent scams and extortion, we <strong>never</strong> automatically release finder or owner contact information.
                        </p>

                        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-sm space-y-4">
                            <div className="flex gap-4">
                                <div className="text-slate-500 w-8">01</div>
                                <div className="text-slate-300">
                                    <span className="text-teal-400 font-bold">MATCH DETECTED:</span>
                                    System identifies potential match between Missing/Found reports.
                                </div>
                            </div>
                            <div className="h-6 border-lborder-slate-800 ml-4 border-l border-dashed opacity-30"></div>

                            <div className="flex gap-4">
                                <div className="text-slate-500 w-8">02</div>
                                <div className="text-slate-300">
                                    <span className="text-indigo-400 font-bold">MODERATOR REVIEW:</span>
                                    Human moderator reviews photos/metadata to verify match plausibility.
                                </div>
                            </div>
                            <div className="h-6 border-l border-slate-800 ml-4 border-l border-dashed opacity-30"></div>

                            <div className="flex gap-4">
                                <div className="text-slate-500 w-8">03</div>
                                <div className="text-slate-300">
                                    <span className="text-yellow-400 font-bold">CONSENT REQUEST:</span>
                                    Moderator contacts OWNER to request permission to share contact info.
                                </div>
                            </div>
                            <div className="h-6 border-l border-slate-800 ml-4 border-l border-dashed opacity-30"></div>

                            <div className="flex gap-4">
                                <div className="text-slate-500 w-8">04</div>
                                <div className="text-white">
                                    <span className="text-green-500 font-bold">INTRODUCTION:</span>
                                    Only AFTER consent is logged does the system bridge the connection.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Retention & Deletion */}
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Retention Schedules</h2>
                            <p className="text-slate-400 text-sm">We only keep data as long as it is operationally useful.</p>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Active Cases</span>
                                    <span className="font-mono text-white">Indefinite</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Reunited Cases</span>
                                    <span className="font-mono text-white">90 Days</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Audit Logs</span>
                                    <span className="font-mono text-white">365 Days</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Unverified Sightings</span>
                                    <span className="font-mono text-white">30 Days</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Your Rights (GDPR+)</h2>
                            <p className="text-slate-400 text-sm">You own your data. We are just the custodians.</p>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <h4 className="font-bold text-white mb-1">Full Export</h4>
                                    <p className="text-xs text-slate-500">Download a JSON package of every data point we hold on you.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <h4 className="font-bold text-red-400 mb-1">Right to Forget</h4>
                                    <p className="text-xs text-slate-500">One-click account deletion. (Pending cases must be closed first).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Transparency */}
                    <div className="p-8 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">AI Transparency & Ethics</h2>
                        <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">
                            Our AI is an advisor, not a judge. It clusters sightings and suggests matches, but it cannot make medical diagnoses or legal determinations.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="p-4 rounded bg-slate-900/50 border border-indigo-500/10">
                                <strong className="block text-indigo-400 mb-1">Advisory Only</strong>
                                <span className="text-slate-400 text-xs">AI outputs are suggestions, requiring human verification.</span>
                            </div>
                            <div className="p-4 rounded bg-slate-900/50 border border-indigo-500/10">
                                <strong className="block text-indigo-400 mb-1">No False Hope</strong>
                                <span className="text-slate-400 text-xs">We strictly prohibit certainty claims like "We found your pet!"</span>
                            </div>
                            <div className="p-4 rounded bg-slate-900/50 border border-indigo-500/10">
                                <strong className="block text-indigo-400 mb-1">Privacy Preserving</strong>
                                <span className="text-slate-400 text-xs">We do not train external models on your private case data.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
