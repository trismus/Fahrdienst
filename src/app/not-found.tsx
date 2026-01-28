import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-gray-300">
            404
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Seite nicht gefunden
          </h2>
          <p className="text-gray-600">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
            Bitte ueberpruefen Sie die URL oder kehren Sie zur Startseite zurueck.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-black text-white hover:bg-gray-800 px-6 py-3"
          >
            Zur Startseite
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
