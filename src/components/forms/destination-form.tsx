'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card, CardHeader, CardTitle } from '@/components/ui';
import { AddressAutocomplete } from '@/components/maps';
import { createDestination, updateDestination } from '@/lib/actions/destinations-v2';
import type { Destination, DestinationType } from '@/types/database';
import type { CreateDestinationInput } from '@/lib/validations/schemas';

interface DestinationFormProps {
  destination?: Destination;
}

const DESTINATION_TYPES: { value: DestinationType; label: string }[] = [
  { value: 'hospital', label: 'Spital' },
  { value: 'doctor', label: 'Arztpraxis' },
  { value: 'therapy', label: 'Therapie' },
  { value: 'other', label: 'Sonstiges' },
];

export function DestinationForm({ destination }: DestinationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDestinationInput>({
    externalId: destination?.externalId || '',
    name: destination?.name || '',
    destinationType: destination?.destinationType || 'other',
    department: destination?.department || '',
    street: destination?.street || '',
    postalCode: destination?.postalCode || '',
    city: destination?.city || '',
    country: destination?.country || 'CH',
    latitude: destination?.latitude || undefined,
    longitude: destination?.longitude || undefined,
    phone: destination?.phone || '',
    email: destination?.email || '',
    openingHours: destination?.openingHours || '',
    arrivalInstructions: destination?.arrivalInstructions || '',
    notes: destination?.notes || '',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (address: string, lat: number, lng: number) => {
    const parts = address.split(',').map(p => p.trim());
    const streetPart = parts[0] || '';
    const cityPart = parts[1] || '';
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
        <CardTitle>{destination ? 'Ziel bearbeiten' : 'Neues Ziel'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Grunddaten</h3>

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="z.B. Kantonsspital Baden"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ
              </label>
              <select
                name="destinationType"
                value={formData.destinationType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DESTINATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Abteilung"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              placeholder="z.B. Dialysezentrum"
            />
          </div>

          <Input
            label="Externe ID"
            name="externalId"
            value={formData.externalId || ''}
            onChange={handleChange}
            placeholder="Optional: ID aus externem System"
          />
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
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Kontakt</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+41 56 486 21 11"
            />
            <Input
              label="E-Mail"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="info@spital.ch"
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 border-b pb-2">Zusätzliche Informationen</h3>

          <Input
            label="Öffnungszeiten"
            name="openingHours"
            value={formData.openingHours || ''}
            onChange={handleChange}
            placeholder="z.B. Mo-Fr 07:00-18:00"
          />

          <Textarea
            label="Ankunftsanweisungen"
            name="arrivalInstructions"
            value={formData.arrivalInstructions || ''}
            onChange={handleChange}
            placeholder="z.B. Haupteingang, dann links zur Anmeldung"
            rows={2}
          />

          <Textarea
            label="Notizen"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            placeholder="Zusätzliche Informationen"
            rows={2}
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
