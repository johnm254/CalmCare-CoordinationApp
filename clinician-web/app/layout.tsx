import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mojo — Clinician',
  description: 'Mojo care-coordination platform — clinician dashboard',
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
      <body className="bg-[#F6F9FC] text-[#0F1B2D] min-h-screen">{children}</body>
    </html>
  );
}
