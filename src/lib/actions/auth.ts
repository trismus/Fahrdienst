'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS } from '@/lib/utils/rate-limit';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const signInSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein'),
});

// Reserved for future sign up functionality
// const signUpSchema = z.object({
//   email: z.string().email('Bitte geben Sie eine gueltige E-Mail-Adresse ein'),
//   password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein'),
//   displayName: z.string().min(2, 'Der Name muss mindestens 2 Zeichen lang sein').optional(),
// });

// =============================================================================
// RESULT TYPES
// =============================================================================

export type AuthResult = {
  success: true;
} | {
  success: false;
  error: string;
  code?: string;
};

// =============================================================================
// SIGN IN
// =============================================================================

export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  // Rate limiting by IP or email
  const email = formData.get('email') as string;
  const rateLimitKey = createRateLimitKey(null, `auth:signin:${email}`);
  const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.login);

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten.',
      code: 'rate_limited',
    };
  }

  // Validate input
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parseResult = signInSchema.safeParse(rawData);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors
      .map((e) => e.message)
      .join(', ');
    return {
      success: false,
      error: errorMessage,
      code: 'validation_error',
    };
  }

  const { email: validEmail, password } = parseResult.data;

  // Attempt sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: validEmail,
    password,
  });

  if (error) {
    // Map Supabase error codes to German user-friendly messages
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Ungültige E-Mail-Adresse oder Passwort.',
      'email_not_confirmed': 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.',
      'user_not_found': 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.',
      'invalid_grant': 'Ungültige Anmeldedaten.',
    };

    const userMessage = errorMessages[error.code || ''] || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';

    return {
      success: false,
      error: userMessage,
      code: error.code,
    };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// =============================================================================
// SIGN OUT
// =============================================================================

export async function signOut(): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    // Log error but don't throw - user should still be redirected
    console.error('Sign out error:', error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}

// =============================================================================
// GET SESSION (for server components)
// =============================================================================

export async function getSession() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// =============================================================================
// GET USER PROFILE WITH ROLE
// =============================================================================

export type UserProfile = {
  id: string;
  email: string | undefined;
  role: 'admin' | 'operator' | 'driver';
  displayName: string | undefined;
  driverId: string | null;
};

/**
 * Gets the current user's profile with role information.
 *
 * SECURITY: This function throws an error if no profile exists.
 * Every authenticated user MUST have a profile configured.
 * The trigger `on_auth_user_created` should auto-create profiles for new users.
 *
 * @throws Error if user is not authenticated
 * @throws Error if user profile is not configured
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // SECURITY FIX: Do not return a fallback role.
    // Missing profile indicates a configuration issue that must be fixed.
    console.error(
      `[AUTH] User ${user.id} has no profile. ` +
      'This should have been created by the on_auth_user_created trigger. ' +
      'Please run the migrate-users-to-profiles.sql script.'
    );
    throw new Error(
      'Benutzerprofil nicht konfiguriert. Bitte kontaktieren Sie den Administrator.'
    );
  }

  // Get driver_id if user is linked to a driver record
  let driverId: string | null = null;
  if (profile.role === 'driver') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    driverId = driver?.id || null;
  }

  return {
    id: user.id,
    email: user.email,
    role: profile.role as 'admin' | 'operator' | 'driver',
    displayName: profile.display_name || user.email,
    driverId,
  };
}

// =============================================================================
// CHECK IF USER IS DISPATCHER (admin or operator)
// =============================================================================

export async function isDispatcher(): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;
  return profile.role === 'admin' || profile.role === 'operator';
}

// =============================================================================
// CHECK IF USER IS DRIVER
// =============================================================================

export async function isDriver(): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;
  return profile.role === 'driver';
}

// =============================================================================
// REQUIRE AUTH (redirect to login if not authenticated)
// =============================================================================

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

// =============================================================================
// REQUIRE DISPATCHER ROLE
// =============================================================================

export async function requireDispatcher() {
  const profile = await getUserProfile();
  if (!profile) {
    redirect('/login');
  }
  if (profile.role !== 'admin' && profile.role !== 'operator') {
    redirect('/my-rides'); // Redirect drivers to their rides
  }
  return profile;
}

// =============================================================================
// REQUIRE DRIVER ROLE
// =============================================================================

export async function requireDriver() {
  const profile = await getUserProfile();
  if (!profile) {
    redirect('/login');
  }
  return profile;
}
