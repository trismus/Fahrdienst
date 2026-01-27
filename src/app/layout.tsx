import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fahrdienst',
  description: 'Dispatching-Plattform für Patiententransporte',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
