'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card, CardHeader, CardTitle } from '@/components/ui';
import { AddressAutocomplete } from '@/components/maps';
import { createPatient, updatePatient } from '@/lib/actions/patients-v2';
import type { Patient } from '@/types/database';
import type { CreatePatientInput } from '@/lib/validations/schemas';

interface PatientFormProps {
  patient?: Patient;
}

export function PatientForm({ patient }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePatientInput>({
    patientNumber: patient?.patientNumber || '',
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    dateOfBirth: patient?.dateOfBirth || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    street: patient?.street || '',
    postalCode: patient?.postalCode || '',
    city: patient?.city || '',
    country: patient?.country || 'CH',
    latitude: patient?.latitude || undefined,
    longitude: patient?.longitude || undefined,
    pickupInstructions: patient?.pickupInstructions || '',
    needsWheelchair: patient?.needsWheelchair || false,
    needsWalker: patient?.needsWalker || false,
    needsAssistance: patient?.needsAssistance || false,
    emergencyContactName: patient?.emergencyContactName || '',
    emergencyContactPhone: patient?.emergencyContactPhone || '',
    insurance: patient?.insurance || '',
    costCenter: patient?.costCenter || '',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressChange = (address: string, lat: number, lng: number) => {
    // Parse address into components (simple approach)
    const parts = address.split(',').map(p => p.trim());
    const streetPart = parts[0] || '';
    const cityPart = parts[1] || '';

    // Try to extract postal code and city
    const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);

    setFormData((prev) => ({
      ...prev,
      street: streetPart,
      postalCode: postalMatch ? postalMatch[1] : prev.postalCode,
      city: postalMatch ? postalMatch[2] : cityPart,
      latitude: lat,
      longitude: lng,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{patient ? 'Patient bearbeiten' : 'Neuer Patient'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Persönliche Daten</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vorname"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Nachname"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Patientennummer"
              name="patientNumber"
              value={formData.patientNumber || ''}
              onChange={handleChange}
              placeholder="z.B. PAT-001"
            />
            <Input
              label="Geburtsdatum"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Kontakt</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+41 79 123 45 67"
              required
            />
            <Input
              label="E-Mail"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="name@beispiel.ch"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Adresse</h3>

          <AddressAutocomplete
            label="Adresse suchen"
            value={`${formData.street}, ${formData.postalCode} ${formData.city}`.replace(/^, | $/g, '')}
            onChange={handleAddressChange}
            placeholder="Strasse, PLZ Ort"
          />

          <Input
            label="Strasse"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="PLZ"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              maxLength={4}
              required
            />
            <div className="col-span-2">
              <Input
                label="Ort"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {formData.latitude && formData.longitude && (
            <div className="text-sm text-gray-500">
              Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </div>
          )}

          <Textarea
            label="Abholanweisungen"
            name="pickupInstructions"
            value={formData.pickupInstructions || ''}
            onChange={handleChange}
            placeholder="z.B. Klingel bei Müller, 2. Stock links"
            rows={2}
          />
        </div>

        {/* Special Needs */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Besondere Bedürfnisse</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="needsWheelchair"
                checked={formData.needsWheelchair}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Rollstuhl benötigt</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="needsWalker"
                checked={formData.needsWalker}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Rollator/Gehhilfe benötigt</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="needsAssistance"
                checked={formData.needsAssistance}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Begleitung/Hilfe beim Ein-/Aussteigen</span>
            </label>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Notfallkontakt</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              name="emergencyContactName"
              value={formData.emergencyContactName || ''}
              onChange={handleChange}
              placeholder="z.B. Maria Müller"
            />
            <Input
              label="Telefon"
              name="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone || ''}
              onChange={handleChange}
              placeholder="+41 79 234 56 78"
            />
          </div>
        </div>

        {/* Insurance */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Versicherung</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Krankenkasse"
              name="insurance"
              value={formData.insurance || ''}
              onChange={handleChange}
              placeholder="z.B. Helsana, CSS, Swica"
            />
            <Input
              label="Kostenstelle"
              name="costCenter"
              value={formData.costCenter || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Bemerkungen</h3>

          <Textarea
            label="Notizen"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            placeholder="Zusätzliche Informationen zum Patienten"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
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
