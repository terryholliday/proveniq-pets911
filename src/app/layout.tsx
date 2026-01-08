import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'PetNexus Pet911 (WV)',
  description: 'Emergency coordination for lost and found pets in West Virginia',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
