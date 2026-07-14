'use server';

import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export async function createFinancialRecord(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied: Only Global Admins can manage financial records' };
  }

  const { data: record, error } = await supabase
    .from('financial_records')
    .insert({
      customer_id: data.customerId,
      appointment_id: data.appointmentId || null,
      work_record_id: data.workRecordId || null,
      record_type: data.recordType,
      description: data.description,
      amount_in_cents: data.amountInCents,
      due_date: data.dueDate || null,
      payment_status: data.paymentStatus,
      payment_method: data.paymentMethod || null,
      reference_number: data.referenceNumber || null,
      internal_memo: data.internalMemo || null,
      customer_visible_description: data.customerVisibleDescription || null,
      customer_visible: data.customerVisible !== undefined ? data.customerVisible : false,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Financial Record Created',
    'financial_records',
    record.id,
    `Financial record of type ${data.recordType} created with value $${(data.amountInCents / 100).toFixed(2)}.`
  );

  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true };
}

export async function deleteFinancialRecord(recordId: string, customerId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied: Only Global Admin can delete financial records' };
  }

  const { error } = await supabase
    .from('financial_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Financial Record Deleted',
    'financial_records',
    recordId,
    `Financial record ID ${recordId} deleted.`
  );

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}

export async function createDocumentRecord(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: record, error } = await supabase
    .from('documents')
    .insert({
      customer_id: data.customerId,
      appointment_id: data.appointmentId || null,
      work_record_id: data.workRecordId || null,
      document_type: data.documentType,
      original_filename: data.originalFilename,
      storage_path: data.storagePath,
      mime_type: data.mimeType || null,
      file_size: data.fileSize || null,
      description: data.description || null,
      customer_visible: data.customerVisible !== undefined ? data.customerVisible : false,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Document Record Created',
    'documents',
    record.id,
    `Document / Receipt "${data.originalFilename}" uploaded successfully.`
  );

  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true };
}

export async function deleteDocumentRecord(documentId: string, customerId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Document Record Deleted',
    'documents',
    documentId,
    `Deleted Document ID ${documentId}.`
  );

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}

export async function getSignedUrl(bucket: string, storagePath: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, signedUrl: data.signedUrl };
}
