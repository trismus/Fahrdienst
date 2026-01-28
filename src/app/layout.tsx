import './globals.css'; // <--- Das ist die wichtigste Zeile!
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BackstagePass 🎭',
  description: 'TGW Vereinsmanager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}