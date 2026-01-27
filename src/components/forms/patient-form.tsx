'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card, CardHeader, CardTitle } from '@/components/ui';
import { AddressAutocomplete } from '@/components/maps';
import { createPatient, updatePatient, type CreatePatientData } from '@/lib/actions/patients';
import type { Patient } from '@/types';

interface PatientFormProps {
  patient?: Patient;
}

export function PatientForm({ patient }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePatientData>({
    name: patient?.name || '',
    address: patient?.address || '',
    latitude: patient?.latitude || 0,
    longitude: patient?.longitude || 0,
    phone: patient?.phone || '',
    special_needs: patient?.special_needs || '',
    notes: patient?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (patient) {
        await updatePatient(patient.id, formData);
      } else {
        await createPatient(formData);
      }
      router.push('/patients');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        <CardTitle>{patient ? 'Patient bearbeiten' : 'Neuer Patient'}</CardTitle>
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

        <Input
          label="Telefon"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <Input
          label="Besondere Bedürfnisse"
          name="special_needs"
          value={formData.special_needs}
          onChange={handleChange}
          placeholder="z.B. Rollstuhl, Gehhilfe"
        />

        <Textarea
          label="Notizen"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Zusätzliche Informationen"
        />

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
