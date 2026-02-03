'use server';

import { z } from 'zod';
import { getUserProfile } from '@/lib/actions/auth';
import { checkRateLimit, createRateLimitKey } from '@/lib/utils/rate-limit';
import { log } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export type FeedbackResult =
  | { success: true; issueUrl: string }
  | { success: false; error: string };

// =============================================================================
// VALIDATION
// =============================================================================

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature']),
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen lang sein'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein'),
  currentUrl: z.string().optional(),
  browserInfo: z.string().optional(),
});

// =============================================================================
// RATE LIMIT CONFIG: 3 per hour per user
// =============================================================================

const FEEDBACK_RATE_LIMIT = {
  windowMs: 3_600_000, // 1 hour
  maxRequests: 3,
};

// =============================================================================
// SUBMIT FEEDBACK
// =============================================================================

export async function submitFeedback(data: {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  currentUrl?: string;
  browserInfo?: string;
}): Promise<FeedbackResult> {
  // 1. Auth check
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet.' };
  }

  // 2. Rate limiting
  const rateLimitKey = createRateLimitKey(profile.id, 'feedback');
  const rateLimitResult = await checkRateLimit(rateLimitKey, FEEDBACK_RATE_LIMIT);

  if (!rateLimitResult.success) {
    const minutesLeft = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60_000);
    return {
      success: false,
      error: `Feedback-Limit erreicht. Bitte versuchen Sie es in ${minutesLeft} Minuten erneut.`,
    };
  }

  // 3. Validate input
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: msg };
  }

  // 4. Check env configuration
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  const repo = process.env.GITHUB_FEEDBACK_REPO;

  if (!token || !repo) {
    log.warn('Feedback submitted but GitHub not configured', {
      feature: 'feedback',
      userId: profile.id,
    });
    return {
      success: false,
      error: 'Feedback-System ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.',
    };
  }

  // 5. Build GitHub issue
  const { type, title, description: desc, currentUrl, browserInfo } = parsed.data;

  const issueTitle = type === 'bug' ? `[Bug] ${title}` : `[Feature] ${title}`;

  const roleLabel =
    profile.role === 'admin'
      ? 'Administrator'
      : profile.role === 'operator'
        ? 'Disponent'
        : 'Fahrer';

  const issueBody = `${desc}

---

**Metadaten**
| Feld | Wert |
|------|------|
| Benutzer | ${profile.displayName || 'Unbekannt'} |
| Rolle | ${roleLabel} |
| Seite | ${currentUrl || 'Nicht verfügbar'} |
| Browser | ${browserInfo || 'Nicht verfügbar'} |
| Zeitpunkt | ${new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })} |`;

  const labels = [type === 'bug' ? 'bug' : 'enhancement', 'user-feedback'];

  // 6. Create GitHub issue
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      log.error(new Error(`GitHub API error: ${response.status}`), {
        feature: 'feedback',
        userId: profile.id,
        payload: { status: response.status, body: errorBody },
      });
      return {
        success: false,
        error: 'Feedback konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
      };
    }

    const issue = await response.json();

    log.info('Feedback submitted successfully', {
      feature: 'feedback',
      userId: profile.id,
      payload: { issueNumber: issue.number, type },
    });

    return { success: true, issueUrl: issue.html_url };
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)), {
      feature: 'feedback',
      userId: profile.id,
    });
    return {
      success: false,
      error: 'Feedback konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
    };
  }
}
