'use client';

import { useState, useTransition } from 'react';
import { Button, Card, CardHeader, CardTitle, Input } from '@/components/ui';
import {
  createAbsence,
  deleteAbsence,
  type Absence,
} from '@/lib/actions/drivers-v2';
import { getDriverRidesForDateRange } from '@/lib/actions/rides-driver';

// =============================================================================
// TYPES
// =============================================================================

interface DriverAbsenceListProps {
  driverId: string;
  absences: Absence[];
}

interface FeedbackState {
  type: 'success' | 'error' | 'warning' | null;
  message: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DriverAbsenceList({ driverId, absences }: DriverAbsenceListProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Check for ride conflicts when dates change
  const checkForConflicts = async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) return;

    try {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);

      const rides = await getDriverRidesForDateRange(
        driverId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const activeRides = rides.filter(
        (r) => r.status !== 'completed' && r.status !== 'cancelled'
      );

      if (activeRides.length > 0) {
        setConflictWarning(
          `Achtung: Du hast ${activeRides.length} ${activeRides.length === 1 ? 'Fahrt' : 'Fahrten'} in diesem Zeitraum. Bitte informiere die Disposition.`
        );
      } else {
        setConflictWarning(null);
      }
    } catch (error) {
      // Silently fail - this is just a helper check
      console.error('Failed to check for conflicts:', error);
    }
  };

  const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Check for conflicts when both dates are set
    if (newFormData.fromDate && newFormData.toDate) {
      checkForConflicts(newFormData.fromDate, newFormData.toDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromDate || !formData.toDate) return;

    // Validate dates
    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setFeedback({ type: 'error', message: 'Das Enddatum muss nach dem Startdatum liegen' });
      return;
    }

    setFeedback({ type: null, message: '' });

    startTransition(async () => {
      try {
        await createAbsence({
          driverId,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          reason: formData.reason || undefined,
        });
        setFormData({ fromDate: '', toDate: '', reason: '' });
        setConflictWarning(null);
        setShowForm(false);
        setFeedback({ type: 'success', message: 'Abwesenheit erfolgreich eingetragen' });

        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback({ type: null, message: '' }), 3000);
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Fehler beim Erstellen der Abwesenheit',
        });
      }
    });
  };

  const handleDelete = (absenceId: string) => {
    if (!confirm('Abwesenheit wirklich loeschen?')) return;

    startTransition(async () => {
      try {
        await deleteAbsence(absenceId, driverId);
        setFeedback({ type: 'success', message: 'Abwesenheit geloescht' });
        setTimeout(() => setFeedback({ type: null, message: '' }), 3000);
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Fehler beim Loeschen',
        });
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
    (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );

  // Split into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAbsences = sortedAbsences.filter(
    (a) => new Date(a.toDate) >= today
  );
  const pastAbsences = sortedAbsences.filter(
    (a) => new Date(a.toDate) < today
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abwesenheiten</CardTitle>
        <Button
          size="sm"
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setFormData({ fromDate: '', toDate: '', reason: '' });
              setConflictWarning(null);
            }
          }}
        >
          {showForm ? 'Abbrechen' : 'Neue Abwesenheit'}
        </Button>
      </CardHeader>

      {/* Feedback Banner */}
      {feedback.type && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : feedback.type === 'warning'
              ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Von"
              type="date"
              value={formData.fromDate}
              onChange={(e) => handleDateChange('fromDate', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Bis"
              type="date"
              value={formData.toDate}
              onChange={(e) => handleDateChange('toDate', e.target.value)}
              required
              min={formData.fromDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {conflictWarning}
                </p>
              </div>
            </div>
          )}

          <Input
            label="Grund (optional)"
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="z.B. Urlaub, Krankheit, Arzttermin"
            className="mb-4"
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setFormData({ fromDate: '', toDate: '', reason: '' });
                setConflictWarning(null);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {/* Absences List */}
      {absences.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Keine Abwesenheiten eingetragen. Plane hier deine Abwesenheiten wie Urlaub oder Krankheit.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Absences */}
          {upcomingAbsences.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Kommende</h4>
              <div className="space-y-2">
                {upcomingAbsences.map((absence) => (
                  <AbsenceItem
                    key={absence.id}
                    absence={absence}
                    onDelete={handleDelete}
                    isPending={isPending}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Absences */}
          {pastAbsences.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Vergangene</h4>
              <div className="space-y-2 opacity-60">
                {pastAbsences.slice(-5).map((absence) => (
                  <AbsenceItem
                    key={absence.id}
                    absence={absence}
                    onDelete={handleDelete}
                    isPending={isPending}
                    formatDate={formatDate}
                    isPast
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

// =============================================================================
// SUB-COMPONENT
// =============================================================================

function AbsenceItem({
  absence,
  onDelete,
  isPending,
  formatDate,
  isPast = false,
}: {
  absence: Absence;
  onDelete: (id: string) => void;
  isPending: boolean;
  formatDate: (date: string) => string;
  isPast?: boolean;
}) {
  const isSingleDay = absence.fromDate === absence.toDate;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {isSingleDay
            ? formatDate(absence.fromDate)
            : `${formatDate(absence.fromDate)} - ${formatDate(absence.toDate)}`}
        </div>
        {absence.reason && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {absence.reason}
          </div>
        )}
      </div>
      {!isPast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(absence.id)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Loeschen
        </Button>
      )}
    </div>
  );
}
