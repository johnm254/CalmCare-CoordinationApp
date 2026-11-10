import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'epimoyo — Clinician',
  description: 'epimoyo care-coordination platform — clinician dashboard',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F5EFE3] text-[#0C1F20] min-h-screen">{children}</body>
    </html>
  );
}
