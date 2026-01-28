import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserProfile, signOut } from '@/lib/actions/auth';

// Sidebar navigation items
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/rides', label: 'Fahrten', icon: 'rides' },
  { href: '/drivers', label: 'Fahrer', icon: 'drivers' },
  { href: '/patients', label: 'Patienten', icon: 'patients' },
  { href: '/destinations', label: 'Ziele', icon: 'destinations' },
];

// Simple SVG icons
function NavIcon({ type }: { type: string }) {
  switch (type) {
    case 'dashboard':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'rides':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'drivers':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'patients':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'destinations':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and role
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Only admin and operator can access dispatcher routes
  if (profile.role !== 'admin' && profile.role !== 'operator') {
    redirect('/my-rides');
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Fahrdienst</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <NavIcon type={item.icon} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {profile.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile.displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile.role === 'admin' ? 'Administrator' : 'Disponent'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Abmelden</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
