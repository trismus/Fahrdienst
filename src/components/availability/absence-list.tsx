'use client';

import { useState, useTransition } from 'react';
import { Button, Card, CardHeader, CardTitle, Input } from '@/components/ui';
import { createAbsence, deleteAbsence } from '@/lib/actions/drivers';
import type { Absence } from '@/types';

interface AbsenceListProps {
  driverId: string;
  absences: Absence[];
  readonly?: boolean;
}

export function AbsenceList({ driverId, absences, readonly = false }: AbsenceListProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_date || !formData.to_date) return;

    startTransition(async () => {
      try {
        await createAbsence({
          driver_id: driverId,
          from_date: formData.from_date,
          to_date: formData.to_date,
          reason: formData.reason || undefined,
        });
        setFormData({ from_date: '', to_date: '', reason: '' });
        setShowForm(false);
      } catch (error) {
        console.error('Failed to create absence:', error);
      }
    });
  };

  const handleDelete = (absenceId: string) => {
    if (!confirm('Abwesenheit wirklich löschen?')) return;

    startTransition(async () => {
      try {
        await deleteAbsence(absenceId, driverId);
      } catch (error) {
        console.error('Failed to delete absence:', error);
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Sort absences by date
  const sortedAbsences = [...absences].sort(
    (a, b) => new Date(a.from_date).getTime() - new Date(b.from_date).getTime()
  );

  // Split into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAbsences = sortedAbsences.filter(
    (a) => new Date(a.to_date) >= today
  );
  const pastAbsences = sortedAbsences.filter(
    (a) => new Date(a.to_date) < today
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abwesenheiten</CardTitle>
        {!readonly && (
          <Button
            size="sm"
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Abbrechen' : 'Neue Abwesenheit'}
          </Button>
        )}
      </CardHeader>

      {/* Add form */}
      {showForm && !readonly && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Von"
              type="date"
              value={formData.from_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, from_date: e.target.value }))}
              required
            />
            <Input
              label="Bis"
              type="date"
              value={formData.to_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, to_date: e.target.value }))}
              required
              min={formData.from_date}
            />
          </div>
          <Input
            label="Grund (optional)"
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="z.B. Urlaub, Krankheit"
            className="mb-4"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Speichern...' : 'Speichern'}
          </Button>
        </form>
      )}

      {/* Absences list */}
      {absences.length === 0 ? (
        <p className="text-gray-500">Keine Abwesenheiten eingetragen</p>
      ) : (
        <div className="space-y-4">
          {upcomingAbsences.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Kommende</h4>
              <div className="space-y-2">
                {upcomingAbsences.map((absence) => (
                  <AbsenceItem
                    key={absence.id}
                    absence={absence}
                    onDelete={handleDelete}
                    readonly={readonly}
                    isPending={isPending}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {pastAbsences.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Vergangene</h4>
              <div className="space-y-2 opacity-60">
                {pastAbsences.slice(-5).map((absence) => (
                  <AbsenceItem
                    key={absence.id}
                    absence={absence}
                    onDelete={handleDelete}
                    readonly={readonly}
                    isPending={isPending}
                    formatDate={formatDate}
                    past
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AbsenceItem({
  absence,
  onDelete,
  readonly,
  isPending,
  formatDate,
  past = false,
}: {
  absence: Absence;
  onDelete: (id: string) => void;
  readonly: boolean;
  isPending: boolean;
  formatDate: (date: string) => string;
  past?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">
          {formatDate(absence.from_date)} - {formatDate(absence.to_date)}
        </div>
        {absence.reason && (
          <div className="text-sm text-gray-500">{absence.reason}</div>
        )}
      </div>
      {!readonly && !past && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(absence.id)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Löschen
        </Button>
      )}
    </div>
  );
}
