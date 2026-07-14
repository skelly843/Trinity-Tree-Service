'use server';

import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export async function createAppointment(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'global_admin' && profile.role !== 'admin')) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      customer_id: data.customerId,
      assigned_admin_id: data.assignedAdminId || null,
      title: data.title,
      service_address: data.serviceAddress,
      status: data.status,
      start_time: data.startTime,
      end_time: data.endTime,
      appointment_notes: data.appointmentNotes,
      internal_notes: data.internalNotes,
      customer_visible_notes: data.customerVisibleNotes,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Appointment Created',
    'appointments',
    appointment.id,
    `Appointment "${data.title}" scheduled for customer ${data.customerId}.`
  );

  revalidatePath('/admin/calendar');
  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true };
}

export async function updateAppointment(appointmentId: string, data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      assigned_admin_id: data.assignedAdminId || null,
      title: data.title,
      service_address: data.serviceAddress,
      status: data.status,
      start_time: data.startTime,
      end_time: data.endTime,
      appointment_notes: data.appointmentNotes,
      internal_notes: data.internalNotes,
      customer_visible_notes: data.customerVisibleNotes,
      updated_by: user.id,
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Appointment Updated',
    'appointments',
    appointmentId,
    `Appointment "${data.title}" updated.`
  );

  revalidatePath('/admin/calendar');
  revalidatePath(`/admin/customers/${appointment.customer_id}`);
  return { success: true };
}

export async function createWorkRecord(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: workRecord, error } = await supabase
    .from('work_records')
    .insert({
      customer_id: data.customerId,
      appointment_id: data.appointmentId || null,
      assigned_employee_id: data.assignedEmployeeId || null,
      title: data.title,
      description: data.description,
      status: data.status,
      date_started: data.dateStarted || null,
      date_completed: data.dateCompleted || null,
      internal_notes: data.internalNotes,
      customer_visible_summary: data.customerVisibleSummary,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Work Record Created',
    'work_records',
    workRecord.id,
    `Work record "${data.title}" created for customer ${data.customerId}.`
  );

  revalidatePath('/admin/work');
  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true };
}

export async function updateWorkRecord(workRecordId: string, data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: workRecord, error } = await supabase
    .from('work_records')
    .update({
      appointment_id: data.appointmentId || null,
      assigned_employee_id: data.assignedEmployeeId || null,
      title: data.title,
      description: data.description,
      status: data.status,
      date_started: data.dateStarted || null,
      date_completed: data.dateCompleted || null,
      internal_notes: data.internalNotes,
      customer_visible_summary: data.customerVisibleSummary,
      updated_by: user.id,
    })
    .eq('id', workRecordId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Work Record Updated',
    'work_records',
    workRecordId,
    `Work record "${data.title}" updated.`
  );

  revalidatePath('/admin/work');
  revalidatePath(`/admin/customers/${workRecord.customer_id}`);
  return { success: true };
}

export async function createCustomerNote(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: note, error } = await supabase
    .from('customer_notes')
    .insert({
      customer_id: data.customerId,
      appointment_id: data.appointmentId || null,
      work_record_id: data.workRecordId || null,
      author_id: user.id,
      content: data.content,
      visibility: data.visibility,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Customer Note Created',
    'customer_notes',
    note.id,
    `Created customer note (visibility: ${data.visibility}) for customer ${data.customerId}.`
  );

  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true };
}

export async function deleteCustomerNote(noteId: string, customerId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('customer_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Customer Note Deleted',
    'customer_notes',
    noteId,
    `Deleted customer note ID ${noteId}.`
  );

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}
