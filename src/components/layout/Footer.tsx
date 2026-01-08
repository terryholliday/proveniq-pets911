'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
            <span>© 2025-2026 PROVENIQ Foundation. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="/about" className="hover:text-slate-300 transition-colors">About</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
