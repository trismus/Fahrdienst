import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserProfile, signOut } from '@/lib/actions/auth';

// =============================================================================
// DRIVER LAYOUT
// Server-side authenticated layout for driver routes
// =============================================================================

// Navigation items for drivers
const navItems = [
  { href: '/my-rides', label: 'Fahrten', icon: 'car' },
  { href: '/my-availability', label: 'Verfuegbarkeit', icon: 'calendar' },
];

// Simple SVG icons
function NavIcon({ type }: { type: string }) {
  switch (type) {
    case 'car':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M5 11h14M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Server-side authentication check
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Drivers can access driver routes, but admins/operators are redirected to dashboard
  if (profile.role === 'admin' || profile.role === 'operator') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile-first header navigation */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <Link href="/my-rides" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <NavIcon type="car" />
              </div>
              <h2 className="text-lg font-bold">Fahrdienst</h2>
            </Link>
            <div className="flex items-center gap-2">
              <nav className="flex gap-1">
                {navItems.map((item) => {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg
                        transition-colors text-sm font-medium
                        text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <NavIcon type={item.icon} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              {/* User info and logout */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
                <span className="text-sm text-gray-400 hidden sm:inline">
                  {profile.displayName}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Abmelden"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe">
        <div className="flex">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-1 py-3
                  transition-colors text-xs font-medium
                  text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="sm:hidden h-20" />
    </div>
  );
}
