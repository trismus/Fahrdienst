import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Fahrdienst</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Dispatching-Plattform für Patiententransporte
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Dispatcher Login
        </Link>
        <Link
          href="/my-rides"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Fahrer Login
        </Link>
      </div>
    </main>
  );
}
