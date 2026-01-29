/**
 * Admin Log Page
 * Issue #58: Application Log List View
 *
 * Server Component with filtering, pagination, and expandable rows
 * Only accessible by admins
 */

import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/auth';
import { getLogs, getLogStats, getLogSources, getLogFeatures } from '@/lib/actions/logs';
import { Card, Badge, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import type { LogEntry, LogLevel, DateRangePreset } from '@/lib/logging/types';
import { getDateRangeFromPreset } from '@/lib/logging/types';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface PageProps {
  searchParams: Promise<{
    level?: string;
    dateRange?: string;
    source?: string;
    feature?: string;
    search?: string;
    page?: string;
    expanded?: string;
  }>;
}

// =============================================================================
// LEVEL BADGE COMPONENT
// =============================================================================

function LogLevelBadge({ level }: { level: LogLevel }) {
  const config: Record<LogLevel, { label: string; variant: 'danger' | 'warning' | 'info' }> = {
    error: { label: 'ERROR', variant: 'danger' },
    warn: { label: 'WARN', variant: 'warning' },
    info: { label: 'INFO', variant: 'info' },
  };

  const { label, variant } = config[level];

  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

function StatsCard({ stats }: { stats: { totalCount: number; errorCount: number; warnCount: number; infoCount: number } }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Gesamt</div>
        <div className="text-2xl font-bold">{stats.totalCount.toLocaleString('de-CH')}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-red-500">Fehler</div>
        <div className="text-2xl font-bold text-red-600">{stats.errorCount.toLocaleString('de-CH')}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-orange-500">Warnungen</div>
        <div className="text-2xl font-bold text-orange-600">{stats.warnCount.toLocaleString('de-CH')}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-blue-500">Info</div>
        <div className="text-2xl font-bold text-blue-600">{stats.infoCount.toLocaleString('de-CH')}</div>
      </Card>
    </div>
  );
}

// =============================================================================
// FILTER FORM COMPONENT
// =============================================================================

function LogFilters({
  currentLevel,
  currentDateRange,
  currentSource,
  currentFeature,
  currentSearch,
  sources,
  features,
}: {
  currentLevel: string;
  currentDateRange: string;
  currentSource: string;
  currentFeature: string;
  currentSearch: string;
  sources: string[];
  features: string[];
}) {
  const levelOptions = [
    { value: 'all', label: 'Alle Level' },
    { value: 'error', label: 'Nur Fehler' },
    { value: 'warn', label: 'Nur Warnungen' },
    { value: 'info', label: 'Nur Info' },
  ];

  const dateRangeOptions = [
    { value: '24h', label: 'Letzte 24 Stunden' },
    { value: '7d', label: 'Letzte 7 Tage' },
    { value: '30d', label: 'Letzte 30 Tage' },
  ];

  const sourceOptions = [
    { value: '', label: 'Alle Quellen' },
    ...sources.map((s) => ({ value: s, label: s })),
  ];

  const featureOptions = [
    { value: '', label: 'Alle Features' },
    ...features.map((f) => ({ value: f, label: f })),
  ];

  return (
    <Card className="p-4 mb-6">
      <form method="GET" className="flex flex-wrap gap-4 items-end">
        <div className="w-40">
          <Select
            name="level"
            label="Log Level"
            options={levelOptions}
            defaultValue={currentLevel || 'all'}
          />
        </div>

        <div className="w-48">
          <Select
            name="dateRange"
            label="Zeitraum"
            options={dateRangeOptions}
            defaultValue={currentDateRange || '24h'}
          />
        </div>

        <div className="w-40">
          <Select
            name="source"
            label="Quelle"
            options={sourceOptions}
            defaultValue={currentSource || ''}
          />
        </div>

        <div className="w-40">
          <Select
            name="feature"
            label="Feature"
            options={featureOptions}
            defaultValue={currentFeature || ''}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Suche
          </label>
          <input
            type="text"
            name="search"
            placeholder="In Nachrichten suchen..."
            defaultValue={currentSearch || ''}
            className="w-full px-3 py-2 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
              border-gray-300"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">Filtern</Button>
          <Link href="/admin/logs">
            <Button variant="ghost" type="button">Zuruecksetzen</Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}

// =============================================================================
// LOG ROW COMPONENT (with expandable details)
// =============================================================================

function LogRow({ log, isExpanded }: { log: LogEntry; isExpanded: boolean }) {
  const formattedTime = log.createdAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Truncate message for preview
  const messagePreview = log.message.length > 100
    ? log.message.substring(0, 100) + '...'
    : log.message;

  return (
    <>
      <TableRow className={isExpanded ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
        <TableCell className="text-sm text-gray-500 whitespace-nowrap font-mono">
          {formattedTime}
        </TableCell>
        <TableCell>
          <LogLevelBadge level={log.level} />
        </TableCell>
        <TableCell className="max-w-md">
          <div className="truncate" title={log.message}>
            {messagePreview}
          </div>
        </TableCell>
        <TableCell className="text-sm text-gray-500">
          {log.source || '-'}
        </TableCell>
        <TableCell className="text-sm text-gray-500">
          {log.route || '-'}
        </TableCell>
        <TableCell>
          <Link
            href={`/admin/logs?expanded=${isExpanded ? '' : log.id}`}
            scroll={false}
          >
            <Button variant="ghost" size="sm">
              {isExpanded ? 'Schliessen' : 'Details'}
            </Button>
          </Link>
        </TableCell>
      </TableRow>

      {/* Expanded details row */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="space-y-4">
              {/* Full message */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nachricht
                </h4>
                <pre className="text-sm bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                  {log.message}
                </pre>
              </div>

              {/* Stack trace if present */}
              {log.stackTrace && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stack Trace
                  </h4>
                  <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded border border-red-200 dark:border-red-800 overflow-x-auto whitespace-pre-wrap">
                    {log.stackTrace}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Details
                  </h4>
                  <dl className="text-sm space-y-1">
                    <div className="flex">
                      <dt className="text-gray-500 w-24">ID:</dt>
                      <dd className="font-mono text-xs">{log.id}</dd>
                    </div>
                    {log.userId && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24">User ID:</dt>
                        <dd className="font-mono text-xs">{log.userId}</dd>
                      </div>
                    )}
                    {log.requestId && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24">Request ID:</dt>
                        <dd className="font-mono text-xs">{log.requestId}</dd>
                      </div>
                    )}
                    {log.feature && (
                      <div className="flex">
                        <dt className="text-gray-500 w-24">Feature:</dt>
                        <dd>{log.feature}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Metadata JSON */}
                {Object.keys(log.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metadata
                    </h4>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// =============================================================================
// PAGINATION COMPONENT
// =============================================================================

function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  // Add ellipsis if needed
  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  // Add pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add ellipsis if needed
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        Seite {currentPage} von {totalPages}
      </div>
      <div className="flex gap-1">
        {/* Previous button */}
        {currentPage > 1 && (
          <Link href={`${baseUrl}&page=${currentPage - 1}`}>
            <Button variant="ghost" size="sm">Zurueck</Button>
          </Link>
        )}

        {/* Page numbers */}
        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-3 py-1 text-gray-400">...</span>
          ) : (
            <Link key={page} href={`${baseUrl}&page=${page}`}>
              <Button
                variant={page === currentPage ? 'primary' : 'ghost'}
                size="sm"
              >
                {page}
              </Button>
            </Link>
          )
        )}

        {/* Next button */}
        {currentPage < totalPages && (
          <Link href={`${baseUrl}&page=${currentPage + 1}`}>
            <Button variant="ghost" size="sm">Weiter</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {hasFilters ? 'Keine passenden Logs gefunden' : 'Keine Logs vorhanden'}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {hasFilters
          ? 'Versuchen Sie, die Filter anzupassen.'
          : 'Logs werden automatisch erfasst, wenn die Anwendung laeuft.'}
      </p>
      {hasFilters && (
        <div className="mt-4">
          <Link href="/admin/logs">
            <Button variant="secondary">Filter zuruecksetzen</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function AdminLogsPage({ searchParams }: PageProps) {
  // Await searchParams (Next.js 15 async pattern)
  const params = await searchParams;

  // Check admin access
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Parse filter params
  const level = (params.level || 'all') as LogLevel | 'all';
  const dateRange = (params.dateRange || '24h') as DateRangePreset;
  const source = params.source || '';
  const feature = params.feature || '';
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const expandedId = params.expanded || '';

  // Calculate date range
  const dateRangeValues = getDateRangeFromPreset(dateRange);

  // Build filter for query
  const filter = {
    level: level !== 'all' ? level : undefined,
    dateFrom: dateRangeValues?.from.toISOString(),
    dateTo: dateRangeValues?.to.toISOString(),
    source: source || undefined,
    feature: feature || undefined,
    search: search || undefined,
  };

  // Check if any filters are active
  const hasFilters = level !== 'all' || source !== '' || feature !== '' || search !== '';

  // Fetch data in parallel
  const [logsResult, stats, sources, features] = await Promise.all([
    getLogs({ filter, pagination: { page, pageSize: 50 } }),
    getLogStats(),
    getLogSources(),
    getLogFeatures(),
  ]);

  // Build base URL for pagination (preserving filters)
  const filterParams = new URLSearchParams();
  if (level !== 'all') filterParams.set('level', level);
  if (dateRange !== '24h') filterParams.set('dateRange', dateRange);
  if (source) filterParams.set('source', source);
  if (feature) filterParams.set('feature', feature);
  if (search) filterParams.set('search', search);
  const baseUrl = `/admin/logs?${filterParams.toString()}`;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Application Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Systemprotokoll und Fehleranalyse
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsCard stats={stats} />

      {/* Filters */}
      <LogFilters
        currentLevel={level}
        currentDateRange={dateRange}
        currentSource={source}
        currentFeature={feature}
        currentSearch={search}
        sources={sources}
        features={features}
      />

      {/* Results */}
      {logsResult.data.length === 0 ? (
        <Card className="p-6">
          <EmptyState hasFilters={hasFilters} />
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Zeitstempel</TableHead>
                <TableHead className="w-24">Level</TableHead>
                <TableHead>Nachricht</TableHead>
                <TableHead className="w-32">Quelle</TableHead>
                <TableHead className="w-40">Route</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsResult.data.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  isExpanded={expandedId === log.id}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-4 pb-4">
            <Pagination
              currentPage={logsResult.page}
              totalPages={logsResult.totalPages}
              baseUrl={baseUrl}
            />
          </div>
        </Card>
      )}

      {/* Footer info */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Logs werden automatisch nach 30 Tagen oder bei mehr als 10.000 Eintraegen bereinigt.
      </div>
    </div>
  );
}
