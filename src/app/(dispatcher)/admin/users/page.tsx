import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/actions/auth';
import { getUsers } from '@/lib/actions/users';
import {
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import type { UserRole } from '@/types/database';

// =============================================================================
// ROLE BADGE
// =============================================================================

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; variant: 'info' | 'warning' | 'default' }> = {
    admin: { label: 'Administrator', variant: 'info' },
    operator: { label: 'Disponent', variant: 'warning' },
    driver: { label: 'Fahrer', variant: 'default' },
  };

  const { label, variant } = config[role];
  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default async function AdminUsersPage() {
  // Check admin access
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const users = await getUsers();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} {users.length === 1 ? 'Benutzer' : 'Benutzer'}
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>Neuer Benutzer</Button>
        </Link>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Keine Benutzer vorhanden
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Erstellen Sie einen neuen Benutzer, um loszulegen.
            </p>
            <div className="mt-4">
              <Link href="/admin/users/new">
                <Button>Neuer Benutzer</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anzeigename</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Verknüpfter Fahrer</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.displayName || '-'}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {user.linkedDriverName || '-'}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        Bearbeiten
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
