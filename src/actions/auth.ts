'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { createAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export async function login(formData: any) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await createAuditLog('User Login', 'auth', user.id, `User logged in with email: ${user.email}`);
  }

  return { success: true };
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function forgotPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function resetPassword(password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function createAdminAccount(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Only Global Admins can perform this action' };
  }

  const adminClient = createAdminClient();
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password || 'TemporaryPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: data.role,
    },
  });

  if (createError) {
    return { success: false, error: createError.message };
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      role: data.role,
      full_name: data.fullName,
      account_status: data.accountStatus || 'active',
    })
    .eq('id', newUser.user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  await createAuditLog(
    'Admin/Employee Created',
    'profiles',
    newUser.user.id,
    `Admin/Employee ${data.fullName} created with role ${data.role} by Global Admin.`,
    null,
    data
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserAccountStatus(userId: string, status: 'active' | 'disabled') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Only Global Admins can perform this action' };
  }

  if (user.id === userId) {
    return { success: false, error: 'You cannot disable your own administrator account' };
  }

  const adminClient = createAdminClient();

  if (status === 'disabled') {
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Account Status Updated',
    'profiles',
    userId,
    `Account status updated to ${status} for user ID ${userId}.`
  );

  revalidatePath('/admin/users');
  return { success: true };
}
