import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duara — Clinician',
  description: 'Duara care-coordination platform — clinician dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B1620] text-[#EAF2F6] min-h-screen">{children}</body>
    </html>
  );
}
