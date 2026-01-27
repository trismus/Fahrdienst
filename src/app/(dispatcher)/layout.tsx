import Link from 'next/link';

export default function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Fahrdienst</h2>
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/rides"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Fahrten
          </Link>
          <Link
            href="/drivers"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Fahrer
          </Link>
          <Link
            href="/patients"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Patienten
          </Link>
          <Link
            href="/destinations"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Ziele
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}
