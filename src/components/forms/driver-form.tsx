'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card, CardHeader, CardTitle } from '@/components/ui';
import { createDriver, updateDriver } from '@/lib/actions/drivers-v2';
import type { Driver, VehicleType } from '@/types/database';
import type { CreateDriverInput } from '@/lib/validations/schemas';

interface DriverFormProps {
  driver?: Driver;
}

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'PKW' },
  { value: 'van', label: 'Van/Kleinbus' },
  { value: 'accessible_van', label: 'Rollstuhltransporter' },
];

export function DriverForm({ driver }: DriverFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDriverInput>({
    driverCode: driver?.driverCode || '',
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    homeStreet: driver?.homeStreet || '',
    homePostalCode: driver?.homePostalCode || '',
    homeCity: driver?.homeCity || '',
    hasDrivingLicense: driver?.hasDrivingLicense ?? true,
    vehicleType: driver?.vehicleType || 'car',
    vehiclePlate: driver?.vehiclePlate || '',
    notes: driver?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (driver) {
        await updateDriver(driver.id, formData);
      } else {
        await createDriver(formData);
      }
      router.push('/drivers');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{driver ? 'Fahrer bearbeiten' : 'Neuer Fahrer'}</CardTitle>
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

          <Input
            label="Fahrerkürzel"
            name="driverCode"
            value={formData.driverCode || ''}
            onChange={handleChange}
            placeholder="z.B. DRV-01"
          />
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

        {/* Home Address */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Wohnadresse</h3>

          <Input
            label="Strasse"
            name="homeStreet"
            value={formData.homeStreet || ''}
            onChange={handleChange}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="PLZ"
              name="homePostalCode"
              value={formData.homePostalCode || ''}
              onChange={handleChange}
              maxLength={4}
            />
            <div className="col-span-2">
              <Input
                label="Ort"
                name="homeCity"
                value={formData.homeCity || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Fahrzeug</h3>

          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              name="hasDrivingLicense"
              checked={formData.hasDrivingLicense}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Gültiger Führerschein vorhanden</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fahrzeugtyp
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Kennzeichen"
              name="vehiclePlate"
              value={formData.vehiclePlate || ''}
              onChange={handleChange}
              placeholder="z.B. AG 123456"
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
            placeholder="Zusätzliche Informationen zum Fahrer"
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
