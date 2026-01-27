'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle } from '@/components/ui';
import { AddressAutocomplete } from '@/components/maps';
import { createDestination, updateDestination, type CreateDestinationData } from '@/lib/actions/destinations';
import type { Destination } from '@/types';

interface DestinationFormProps {
  destination?: Destination;
}

export function DestinationForm({ destination }: DestinationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDestinationData>({
    name: destination?.name || '',
    address: destination?.address || '',
    latitude: destination?.latitude || 0,
    longitude: destination?.longitude || 0,
    arrival_window_start: destination?.arrival_window_start || '08:00',
    arrival_window_end: destination?.arrival_window_end || '18:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (destination) {
        await updateDestination(destination.id, formData);
      } else {
        await createDestination(formData);
      }
      router.push('/destinations');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddressChange = (address: string, lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      address,
      latitude: lat,
      longitude: lng,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{destination ? 'Ziel bearbeiten' : 'Neues Ziel'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="z.B. Universitätsspital Zürich"
        />

        <AddressAutocomplete
          label="Adresse"
          value={formData.address}
          onChange={handleAddressChange}
          placeholder="Straße, PLZ Ort"
          required
        />

        {formData.latitude !== 0 && formData.longitude !== 0 && (
          <div className="text-sm text-gray-500">
            Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ankunftsfenster von"
            name="arrival_window_start"
            type="time"
            value={formData.arrival_window_start}
            onChange={handleChange}
            required
          />
          <Input
            label="Ankunftsfenster bis"
            name="arrival_window_end"
            type="time"
            value={formData.arrival_window_end}
            onChange={handleChange}
            required
          />
        </div>

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
