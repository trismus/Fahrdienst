import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/actions/auth';
import { getUnlinkedDrivers } from '@/lib/actions/users';
import { UserForm } from '@/components/forms/user-form';
import { Button } from '@/components/ui';

export default async function NewUserPage() {
  // Check admin access
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const unlinkedDrivers = await getUnlinkedDrivers();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            &larr; Zurück zur Benutzerliste
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl">
        <UserForm unlinkedDrivers={unlinkedDrivers} />
      </div>
    </div>
  );
}
