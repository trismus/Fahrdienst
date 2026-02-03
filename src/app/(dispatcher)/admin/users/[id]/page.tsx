import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/actions/auth';
import { getUserById, getUnlinkedDrivers } from '@/lib/actions/users';
import { UserForm } from '@/components/forms/user-form';
import { Button } from '@/components/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;

  // Check admin access
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const [user, unlinkedDrivers] = await Promise.all([
    getUserById(id),
    getUnlinkedDrivers(id),
  ]);

  if (!user) {
    notFound();
  }

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
        <UserForm user={user} unlinkedDrivers={unlinkedDrivers} />
      </div>
    </div>
  );
}
