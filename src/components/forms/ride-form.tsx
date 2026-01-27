'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui';
import { createRide, updateRide, type CreateRideData } from '@/lib/actions/rides';
import type { Ride, Patient, Driver, Destination, RideStatus } from '@/types';

interface RideFormProps {
  ride?: Ride;
  patients: Patient[];
  drivers: Driver[];
  destinations: Destination[];
}

const statusOptions = [
  { value: 'planned', label: 'Geplant' },
  { value: 'confirmed', label: 'Bestätigt' },
  { value: 'in_progress', label: 'Unterwegs' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Storniert' },
];

export function RideForm({ ride, patients, drivers, destinations }: RideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format datetime for input
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    patient_id: ride?.patient_id || '',
    driver_id: ride?.driver_id || '',
    destination_id: ride?.destination_id || '',
    pickup_time: formatDateTimeLocal(ride?.pickup_time) || '',
    arrival_time: formatDateTimeLocal(ride?.arrival_time) || '',
    return_time: formatDateTimeLocal(ride?.return_time) || '',
    status: (ride?.status || 'planned') as RideStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: CreateRideData = {
        patient_id: formData.patient_id,
        destination_id: formData.destination_id,
        pickup_time: new Date(formData.pickup_time).toISOString(),
        arrival_time: new Date(formData.arrival_time).toISOString(),
        status: formData.status,
      };

      if (formData.driver_id) {
        data.driver_id = formData.driver_id;
      }
      if (formData.return_time) {
        data.return_time = new Date(formData.return_time).toISOString();
      }

      if (ride) {
        await updateRide(ride.id, data);
      } else {
        await createRide(data);
      }
      router.push('/rides');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ride ? 'Fahrt bearbeiten' : 'Neue Fahrt'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Select
          label="Patient"
          name="patient_id"
          value={formData.patient_id}
          onChange={handleChange}
          options={patients.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="Patient auswählen"
          required
        />

        <Select
          label="Ziel"
          name="destination_id"
          value={formData.destination_id}
          onChange={handleChange}
          options={destinations.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Ziel auswählen"
          required
        />

        <Select
          label="Fahrer (optional)"
          name="driver_id"
          value={formData.driver_id}
          onChange={handleChange}
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Fahrer auswählen"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Abholzeit"
            name="pickup_time"
            type="datetime-local"
            value={formData.pickup_time}
            onChange={handleChange}
            required
          />
          <Input
            label="Ankunftszeit"
            name="arrival_time"
            type="datetime-local"
            value={formData.arrival_time}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Rückfahrtzeit (optional)"
          name="return_time"
          type="datetime-local"
          value={formData.return_time}
          onChange={handleChange}
        />

        {ride && (
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Speichern...' : 'Speichern'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </Card>
  );
}
