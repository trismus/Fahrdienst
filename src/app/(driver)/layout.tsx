'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// =============================================================================
// DRIVER LAYOUT
// Mobile-first layout for driver routes
// =============================================================================

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/my-rides', label: 'Fahrten', icon: CarIcon },
    { href: '/my-availability', label: 'Verfuegbarkeit', icon: CalendarIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/my-rides') {
      return pathname === '/my-rides' || pathname.startsWith('/my-rides/');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile-first header navigation */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <Link href="/my-rides" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <CarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">Fahrdienst</h2>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      transition-colors text-sm font-medium
                      ${active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
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
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex-1 flex flex-col items-center gap-1 py-3
                  transition-colors text-xs font-medium
                  ${active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
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

// =============================================================================
// ICONS
// =============================================================================

function CarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 17h.01M16 17h.01M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M5 11h14M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
