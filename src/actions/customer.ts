'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { createAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Only Global Admins can create customer records directly' };
  }

  let linkedProfileId: string | null = null;
  const adminClient = createAdminClient();

  const tempPassword = 'TempPassword123!';
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: 'customer',
    },
  });

  if (authError) {
    return { success: false, error: `Failed to create login credential: ${authError.message}` };
  }

  linkedProfileId = authUser.user.id;

  await adminClient
    .from('profiles')
    .update({
      role: 'customer',
      full_name: data.fullName,
      phone: data.phone,
      secondary_phone: data.secondaryPhone,
      service_address: data.serviceAddress,
      billing_address: data.billingAddress,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      preferred_contact_method: data.preferredContactMethod,
      account_status: data.accountStatus || 'active',
    })
    .eq('id', linkedProfileId);

  const { data: customerRecord, error: customerError } = await adminClient
    .from('customers')
    .insert({
      profile_id: linkedProfileId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      secondary_phone: data.secondaryPhone,
      service_address: data.serviceAddress,
      billing_address: data.billingAddress,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      preferred_contact_method: data.preferredContactMethod,
      account_status: data.accountStatus || 'active',
      general_notes: data.generalNotes,
    })
    .select()
    .single();

  if (customerError) {
    return { success: false, error: customerError.message };
  }

  await createAuditLog(
    'Customer Created',
    'customers',
    customerRecord.id,
    `Customer ${data.fullName} created successfully.`,
    null,
    customerRecord
  );

  revalidatePath('/admin/customers');
  return { success: true, customerId: customerRecord.id };
}

export async function updateCustomer(customerId: string, data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'global_admin' && profile.role !== 'admin')) {
    return { success: false, error: 'Unauthorized role' };
  }

  if (profile.role === 'admin') {
    const { data: isAssigned } = await supabase
      .from('admin_customer_assignments')
      .select('id')
      .eq('admin_id', user.id)
      .eq('customer_id', customerId)
      .single();

    if (!isAssigned) {
      return { success: false, error: 'Access Denied: Customer not assigned to you' };
    }
  }

  const { data: currentCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  const { error } = await supabase
    .from('customers')
    .update({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      secondary_phone: data.secondaryPhone,
      service_address: data.serviceAddress,
      billing_address: data.billingAddress,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      preferred_contact_method: data.preferredContactMethod,
      account_status: data.accountStatus || 'active',
      general_notes: data.generalNotes,
    })
    .eq('id', customerId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (currentCustomer?.profile_id) {
    const adminClient = createAdminClient();
    await adminClient
      .from('profiles')
      .update({
        full_name: data.fullName,
        phone: data.phone,
        secondary_phone: data.secondaryPhone,
        service_address: data.serviceAddress,
        billing_address: data.billingAddress,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        preferred_contact_method: data.preferredContactMethod,
        account_status: data.accountStatus || 'active',
      })
      .eq('id', currentCustomer.profile_id);
  }

  await createAuditLog(
    'Customer Updated',
    'customers',
    customerId,
    `Customer ${data.fullName} details updated.`,
    currentCustomer,
    data
  );

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}

export async function assignCustomerToAdmin(customerId: string, adminId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied: Only Global Admin can change assignments' };
  }

  const { error } = await supabase
    .from('admin_customer_assignments')
    .insert({ customer_id: customerId, admin_id: adminId });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This assignment already exists' };
    }
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Customer Assignment Added',
    'admin_customer_assignments',
    customerId,
    `Assigned customer ${customerId} to employee/admin ${adminId}.`
  );

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}

export async function removeCustomerAssignment(customerId: string, adminId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied: Only Global Admin can modify assignments' };
  }

  const { error } = await supabase
    .from('admin_customer_assignments')
    .delete()
    .eq('customer_id', customerId)
    .eq('admin_id', adminId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Customer Assignment Removed',
    'admin_customer_assignments',
    customerId,
    `Removed assignment of customer ${customerId} from employee/admin ${adminId}.`
  );

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}
