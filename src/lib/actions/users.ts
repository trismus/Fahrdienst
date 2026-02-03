'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateId } from '@/lib/utils/sanitize';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  validate,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from '@/lib/validations/schemas';
import { checkRateLimit, createRateLimitKey } from '@/lib/utils/rate-limit';
import { log } from '@/lib/logging';
import type { UserRole } from '@/types/database';

// =============================================================================
// TYPES
// =============================================================================

export type UserListItem = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  linkedDriverId: string | null;
  linkedDriverName: string | null;
  createdAt: string;
};

export type UserDetail = UserListItem;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// ADMIN GUARD
// =============================================================================

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Nicht authentifiziert');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('Nur Administratoren haben Zugriff auf diese Funktion');
  }

  return user;
}

// =============================================================================
// GET USERS
// =============================================================================

export async function getUsers(): Promise<UserListItem[]> {
  await requireAdmin();

  const adminClient = createAdminClient();

  // Fetch auth users for emails
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError) {
    log.error(authError instanceof Error ? authError : new Error(String(authError)), {
      feature: 'users',
      route: 'getUsers',
    });
    throw new Error('Fehler beim Laden der Benutzer');
  }

  const authUsers = authData?.users || [];

  // Fetch profiles with driver links
  const supabase = await createClient();
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, display_name, created_at')
    .order('created_at', { ascending: false });

  if (profileError) {
    throw new Error('Fehler beim Laden der Profile');
  }

  // Fetch driver links
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, user_id, first_name, last_name')
    .not('user_id', 'is', null)
    .eq('is_active', true);

  const driverMap = new Map(
    (drivers || []).map((d) => [d.user_id, { id: d.id, name: `${d.first_name} ${d.last_name}` }])
  );

  const authMap = new Map(
    authUsers.map((u) => [u.id, u.email || ''])
  );

  return (profiles || []).map((profile) => ({
    id: profile.id,
    email: authMap.get(profile.id) || '',
    displayName: profile.display_name,
    role: profile.role as UserRole,
    linkedDriverId: driverMap.get(profile.id)?.id || null,
    linkedDriverName: driverMap.get(profile.id)?.name || null,
    createdAt: profile.created_at,
  }));
}

// =============================================================================
// GET USER BY ID
// =============================================================================

export async function getUserById(id: string): Promise<UserDetail | null> {
  await requireAdmin();
  const validId = validateId(id, 'user');

  const adminClient = createAdminClient();

  // Fetch auth user for email
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(validId);

  if (authError || !authData?.user) {
    return null;
  }

  // Fetch profile
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, display_name, created_at')
    .eq('id', validId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Fetch driver link
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('user_id', validId)
    .eq('is_active', true)
    .single();

  return {
    id: profile.id,
    email: authData.user.email || '',
    displayName: profile.display_name,
    role: profile.role as UserRole,
    linkedDriverId: driver?.id || null,
    linkedDriverName: driver ? `${driver.first_name} ${driver.last_name}` : null,
    createdAt: profile.created_at,
  };
}

// =============================================================================
// GET UNLINKED DRIVERS
// =============================================================================

export async function getUnlinkedDrivers(
  currentUserId?: string
): Promise<{ id: string; name: string }[]> {
  await requireAdmin();

  const supabase = await createClient();

  // Get drivers that have no user_id set (unlinked)
  const { data, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, user_id')
    .eq('is_active', true)
    .order('last_name')
    .order('first_name');

  if (error) {
    throw new Error('Fehler beim Laden der Fahrer');
  }

  // Filter: include unlinked drivers + driver linked to current user being edited
  return (data || [])
    .filter((d) => !d.user_id || d.user_id === currentUserId)
    .map((d) => ({
      id: d.id,
      name: `${d.first_name} ${d.last_name}`,
    }));
}

// =============================================================================
// CREATE USER
// =============================================================================

export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  const currentUser = await requireAdmin();

  // Rate limiting
  const rateLimitKey = createRateLimitKey(currentUser.id, 'users:create');
  const rateLimitResult = await checkRateLimit(rateLimitKey, { windowMs: 60_000, maxRequests: 5 });

  if (!rateLimitResult.success) {
    return { success: false, error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' };
  }

  // Validate input
  let validatedInput: CreateUserInput;
  try {
    validatedInput = validate(createUserSchema, input);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ungültige Eingabedaten',
    };
  }

  try {
    const adminClient = createAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        return { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet.' };
      }
      log.error(authError instanceof Error ? authError : new Error(String(authError)), {
        feature: 'users',
        route: 'createUser',
      });
      return { success: false, error: 'Fehler beim Erstellen des Benutzers.' };
    }

    const newUserId = authData.user.id;

    // 2. Update profile (trigger creates with role=driver by default)
    const supabase = await createClient();
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: validatedInput.role,
        display_name: validatedInput.displayName,
      })
      .eq('id', newUserId);

    if (profileError) {
      log.error(new Error(String(profileError.message)), {
        feature: 'users',
        route: 'createUser',
        payload: { step: 'profile_update', userId: newUserId },
      });
    }

    // 3. Link driver if specified
    if (validatedInput.driverId) {
      const validDriverId = validateId(validatedInput.driverId, 'driver');
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ user_id: newUserId })
        .eq('id', validDriverId);

      if (driverError) {
        log.error(new Error(String(driverError.message)), {
          feature: 'users',
          route: 'createUser',
          payload: { step: 'driver_link', userId: newUserId, driverId: validDriverId },
        });
        // Don't fail the whole operation for driver link errors
      }
    }

    log.info('Benutzer erstellt', {
      feature: 'users',
      route: 'createUser',
      userId: currentUser.id,
      payload: { newUserId, role: validatedInput.role },
    });

    revalidatePath('/admin/users');
    return { success: true, data: { id: newUserId } };
  } catch (err) {
    log.error(err instanceof Error ? err : new Error(String(err)), {
      feature: 'users',
      route: 'createUser',
    });
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}

// =============================================================================
// UPDATE USER
// =============================================================================

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<ActionResult> {
  const currentUser = await requireAdmin();
  const validId = validateId(id, 'user');

  // Validate input
  let validatedInput: UpdateUserInput;
  try {
    validatedInput = validate(updateUserSchema, input);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ungültige Eingabedaten',
    };
  }

  try {
    const supabase = await createClient();

    // Update profile
    const profileUpdate: Record<string, unknown> = {};
    if (validatedInput.displayName !== undefined) {
      profileUpdate.display_name = validatedInput.displayName;
    }
    if (validatedInput.role !== undefined) {
      profileUpdate.role = validatedInput.role;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', validId);

      if (profileError) {
        // Check for last admin demotion
        if (profileError.message?.includes('letzter Administrator') || profileError.message?.includes('last admin')) {
          return { success: false, error: 'Der letzte Administrator kann nicht herabgestuft werden.' };
        }
        log.error(new Error(String(profileError.message)), {
          feature: 'users',
          route: 'updateUser',
        });
        return { success: false, error: `Fehler beim Aktualisieren des Profils: ${profileError.message}` };
      }
    }

    // Handle driver link changes
    if (validatedInput.driverId !== undefined) {
      // First, unlink any currently linked driver
      const { data: currentLinked } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', validId)
        .eq('is_active', true)
        .single();

      if (currentLinked) {
        await supabase
          .from('drivers')
          .update({ user_id: null })
          .eq('id', currentLinked.id);
      }

      // Link new driver if specified
      if (validatedInput.driverId) {
        const validDriverId = validateId(validatedInput.driverId, 'driver');
        const { error: linkError } = await supabase
          .from('drivers')
          .update({ user_id: validId })
          .eq('id', validDriverId);

        if (linkError) {
          log.error(new Error(String(linkError.message)), {
            feature: 'users',
            route: 'updateUser',
            payload: { step: 'driver_link', userId: validId, driverId: validDriverId },
          });
          return { success: false, error: 'Fehler beim Verknüpfen des Fahrers.' };
        }
      }
    }

    log.info('Benutzer aktualisiert', {
      feature: 'users',
      route: 'updateUser',
      userId: currentUser.id,
      payload: { targetUserId: validId, changes: Object.keys(validatedInput) },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${validId}`);
    return { success: true, data: undefined };
  } catch (err) {
    log.error(err instanceof Error ? err : new Error(String(err)), {
      feature: 'users',
      route: 'updateUser',
    });
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}

// =============================================================================
// RESET PASSWORD
// =============================================================================

export async function resetUserPassword(
  id: string,
  input: ResetPasswordInput
): Promise<ActionResult> {
  const currentUser = await requireAdmin();
  const validId = validateId(id, 'user');

  // Rate limiting
  const rateLimitKey = createRateLimitKey(currentUser.id, 'users:reset-password');
  const rateLimitResult = await checkRateLimit(rateLimitKey, { windowMs: 60_000, maxRequests: 5 });

  if (!rateLimitResult.success) {
    return { success: false, error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' };
  }

  // Validate input
  let validatedInput: ResetPasswordInput;
  try {
    validatedInput = validate(resetPasswordSchema, input);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ungültige Eingabedaten',
    };
  }

  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(validId, {
      password: validatedInput.password,
    });

    if (error) {
      log.error(error instanceof Error ? error : new Error(String(error)), {
        feature: 'users',
        route: 'resetUserPassword',
      });
      return { success: false, error: 'Fehler beim Zurücksetzen des Passworts.' };
    }

    log.info('Passwort zurückgesetzt', {
      feature: 'users',
      route: 'resetUserPassword',
      userId: currentUser.id,
      payload: { targetUserId: validId },
    });

    return { success: true, data: undefined };
  } catch (err) {
    log.error(err instanceof Error ? err : new Error(String(err)), {
      feature: 'users',
      route: 'resetUserPassword',
    });
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}
