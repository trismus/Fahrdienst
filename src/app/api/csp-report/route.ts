import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Reporting Endpoint
 *
 * Receives Content Security Policy violation reports from browsers.
 * These reports help identify:
 * 1. XSS attacks being blocked
 * 2. Misconfigured CSP (legitimate resources being blocked)
 * 3. Third-party scripts that need to be allowed
 *
 * To enable reporting, add to CSP header:
 * report-uri /api/csp-report; report-to csp-endpoint
 *
 * Note: Currently logging to console. In production, consider:
 * - Sending to a logging service (Sentry, LogRocket, etc.)
 * - Storing in database for analysis
 * - Alerting on high volume (possible attack)
 */

interface CspViolationReport {
  'csp-report'?: {
    'blocked-uri'?: string;
    'column-number'?: number;
    'document-uri'?: string;
    'effective-directive'?: string;
    'line-number'?: number;
    'original-policy'?: string;
    referrer?: string;
    'script-sample'?: string;
    'source-file'?: string;
    'status-code'?: number;
    'violated-directive'?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the violation report
    const report: CspViolationReport = await request.json();

    // Extract relevant information
    const violation = report['csp-report'];

    if (!violation) {
      return new NextResponse('', { status: 400 });
    }

    // Log the violation
    // In production, send this to a logging service
    console.warn('[CSP Violation]', {
      blockedUri: violation['blocked-uri'],
      documentUri: violation['document-uri'],
      effectiveDirective: violation['effective-directive'],
      violatedDirective: violation['violated-directive'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      // Don't log full policy or script sample (can be large)
      timestamp: new Date().toISOString(),
    });

    // Detect potential attacks
    const isLikelyAttack = detectPotentialAttack(violation);
    if (isLikelyAttack) {
      console.error('[CSP Violation] Potential XSS attack detected', {
        blockedUri: violation['blocked-uri'],
        scriptSample: violation['script-sample']?.substring(0, 100), // Truncate
      });
      // In production: trigger alert, log to security monitoring
    }

    // Return 204 No Content (standard response for report-uri)
    return new NextResponse('', { status: 204 });
  } catch (error) {
    // Don't expose error details
    console.error('[CSP Report] Error processing report:', error instanceof Error ? error.message : 'Unknown');
    return new NextResponse('', { status: 400 });
  }
}

/**
 * Attempts to detect if a CSP violation might be an attack.
 * This is heuristic-based and may have false positives/negatives.
 */
function detectPotentialAttack(
  violation: CspViolationReport['csp-report']
): boolean {
  if (!violation) return false;

  const blockedUri = violation['blocked-uri']?.toLowerCase() || '';
  const scriptSample = violation['script-sample']?.toLowerCase() || '';

  // Suspicious patterns
  const suspiciousPatterns = [
    'javascript:', // javascript: protocol
    'data:', // data: URIs (can be legitimate, but often attacks)
    'eval(', // eval usage
    'document.cookie', // cookie stealing
    'document.location', // redirect
    'window.location', // redirect
    '<script', // script injection
    'onerror', // event handler injection
    'onload', // event handler injection
    'onclick', // event handler injection
    'alert(', // testing/attack
    'prompt(', // testing/attack
    'confirm(', // testing/attack
  ];

  // Check blocked URI
  for (const pattern of suspiciousPatterns) {
    if (blockedUri.includes(pattern) || scriptSample.includes(pattern)) {
      return true;
    }
  }

  // Check for inline script violations with suspicious content
  if (violation['effective-directive']?.includes('script-src') && scriptSample) {
    // Base64 encoded content (often used to obfuscate attacks)
    if (/atob|btoa|base64/i.test(scriptSample)) {
      return true;
    }
  }

  return false;
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse('', {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
