'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle } from '@/components/ui';
import { createUser, updateUser, resetUserPassword } from '@/lib/actions/users';
import type { UserDetail } from '@/lib/actions/users';
import type { UserRole } from '@/types/database';

interface UserFormProps {
  user?: UserDetail;
  unlinkedDrivers: { id: string; name: string }[];
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'operator', label: 'Disponent' },
  { value: 'driver', label: 'Fahrer' },
];

export function UserForm({ user, unlinkedDrivers }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'operator');
  const [driverId, setDriverId] = useState<string>(user?.linkedDriverId || '');

  // Password reset
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEdit) {
        const result = await updateUser(user.id, {
          displayName: displayName || undefined,
          role,
          driverId: role === 'driver' ? (driverId || null) : null,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }

        router.push('/admin/users');
        router.refresh();
      } else {
        if (!email || !password || !displayName) {
          setError('Bitte füllen Sie alle Pflichtfelder aus.');
          return;
        }

        const result = await createUser({
          email,
          password,
          displayName,
          role,
          driverId: role === 'driver' ? (driverId || null) : null,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }

        router.push('/admin/users');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const result = await resetUserPassword(user.id, { password: resetPassword });

      if (!result.success) {
        setResetError(result.error);
        return;
      }

      setResetPassword('');
      setResetSuccess('Passwort wurde erfolgreich zurückgesetzt.');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
              Kontoinformationen
            </h3>

            {isEdit ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
            ) : (
              <>
                <Input
                  label="E-Mail"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.ch"
                  required
                />
                <Input
                  label="Passwort"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  required
                />
              </>
            )}
          </div>

          {/* User Data */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
              Benutzerdaten
            </h3>

            <Input
              label="Anzeigename"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Vor- und Nachname"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rolle
              </label>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Driver Link - only when role is driver */}
          {role === 'driver' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                Fahrer-Verknüpfung
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verknüpfter Fahrer
                </label>
                <select
                  name="driverId"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kein Fahrer verknüpft</option>
                  {unlinkedDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Nur unverknüpfte Fahrer werden angezeigt.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Speichern...'
                : isEdit
                  ? 'Speichern'
                  : 'Erstellen'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/users')}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Reset - only in edit mode */}
      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Passwort zurücksetzen</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {resetError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {resetSuccess}
              </div>
            )}

            <Input
              label="Neues Passwort"
              name="resetPassword"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />

            <Button
              type="button"
              variant="secondary"
              disabled={resetLoading || resetPassword.length < 8}
              onClick={handleResetPassword}
            >
              {resetLoading ? 'Zurücksetzen...' : 'Passwort zurücksetzen'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
