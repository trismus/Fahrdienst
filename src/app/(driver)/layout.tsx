import Link from 'next/link';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile-first header navigation */}
      <header className="bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Fahrdienst</h2>
          <nav className="flex gap-4">
            <Link
              href="/my-rides"
              className="px-3 py-1 rounded hover:bg-gray-800 transition-colors"
            >
              Fahrten
            </Link>
            <Link
              href="/my-availability"
              className="px-3 py-1 rounded hover:bg-gray-800 transition-colors"
            >
              Verfügbarkeit
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}
