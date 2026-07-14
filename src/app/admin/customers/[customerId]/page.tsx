import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  Trash,
  Shield,
  Plus
} from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { createAppointment, createWorkRecord, createCustomerNote } from '@/actions/schedule_work';
import { createFinancialRecord, createDocumentRecord } from '@/actions/finance_docs';
import { assignCustomerToAdmin, removeCustomerAssignment } from '@/actions/customer';

export const revalidate = 0;

export default async function CustomerWorkspacePage({
  params,
  searchParams,
}: {
  params: { customerId: string };
  searchParams: { tab?: string; error?: string; success?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobal = profile?.role === 'global_admin';
  const tab = searchParams.tab || 'overview';

  const { data: customer, error: fetchErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.customerId)
    .single();

  if (fetchErr || !customer) {
    redirect('/admin/customers');
  }

  if (!isGlobal) {
    const { data: isAssigned } = await supabase
      .from('admin_customer_assignments')
      .select('id')
      .eq('admin_id', user.id)
      .eq('customer_id', params.customerId)
      .single();

    if (!isAssigned) {
      redirect('/unauthorized');
    }
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('customer_id', params.customerId)
    .order('start_time', { ascending: false });

  const { data: workRecords } = await supabase
    .from('work_records')
    .select('*')
    .eq('customer_id', params.customerId)
    .order('created_at', { ascending: false });

  const { data: notes } = await supabase
    .from('customer_notes')
    .select('*, profiles(full_name)')
    .eq('customer_id', params.customerId)
    .order('created_at', { ascending: false });

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('customer_id', params.customerId)
    .order('created_at', { ascending: false });

  let financials: any[] = [];
  if (isGlobal) {
    const { data: finData } = await supabase
      .from('financial_records')
      .select('*')
      .eq('customer_id', params.customerId)
      .order('transaction_date', { ascending: false });
    financials = finData || [];
  }

  const { data: teamList } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['global_admin', 'admin']);

  const { data: currentAssignments } = await supabase
    .from('admin_customer_assignments')
    .select('*, profiles(full_name)')
    .eq('customer_id', params.customerId);

  async function handleAddAppointment(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const start = formData.get('start_time') as string;
    const end = formData.get('end_time') as string;
    const notes = formData.get('notes') as string;
    const admin = formData.get('assigned_admin_id') as string;

    await createAppointment({
      customerId: params.customerId,
      title,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      status: 'Scheduled',
      appointmentNotes: notes,
      assignedAdminId: admin || null,
    });
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleAddWorkRecord(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const emp = formData.get('assigned_employee_id') as string;

    await createWorkRecord({
      customerId: params.customerId,
      title,
      description,
      status: 'Scheduled',
      assignedEmployeeId: emp || null,
    });
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleAddNote(formData: FormData) {
    'use server';
    const content = formData.get('content') as string;
    const visibility = formData.get('visibility') as string;

    await createCustomerNote({
      customerId: params.customerId,
      content,
      visibility,
    });
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleAddFinancial(formData: FormData) {
    'use server';
    const desc = formData.get('description') as string;
    const type = formData.get('record_type') as string;
    const amt = parseFloat(formData.get('amount') as string) * 100;
    const status = formData.get('payment_status') as string;
    const vis = formData.get('customer_visible') === 'true';

    await createFinancialRecord({
      customerId: params.customerId,
      description: desc,
      recordType: type,
      amountInCents: Math.round(amt),
      paymentStatus: status,
      customerVisible: vis,
    });
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleAssignAdmin(formData: FormData) {
    'use server';
    const adminId = formData.get('admin_id') as string;
    await assignCustomerToAdmin(params.customerId, adminId);
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleRemoveAssign(adminId: string) {
    'use server';
    await removeCustomerAssignment(params.customerId, adminId);
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  async function handleAddDocument(formData: FormData) {
    'use server';
    const filename = formData.get('filename') as string;
    const type = formData.get('document_type') as string;
    const path = formData.get('path') as string;
    const vis = formData.get('customer_visible') === 'true';

    await createDocumentRecord({
      customerId: params.customerId,
      originalFilename: filename,
      documentType: type,
      storagePath: path,
      customerVisible: vis,
    });
    revalidatePath(`/admin/customers/${params.customerId}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/customers" className="p-2 bg-white rounded-lg border border-gray-200/50 hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{customer.full_name}</h1>
            <p className="text-gray-500 text-sm">Customer Profile & Operational Workspace</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${
            customer.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            Account Status: {customer.account_status}
          </span>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 bg-white p-1 rounded-xl shadow-sm">
        {['overview', 'appointments', 'work', 'notes', 'docs', 'financials'].map(t => {
          if (t === 'financials' && !isGlobal) return null;
          const active = tab === t;
          return (
            <Link
              key={t}
              href={`/admin/customers/${params.customerId}?tab=${t}`}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${
                active ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 md:p-8">

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-emerald-600" />
                <span>Contact Details</span>
              </h2>
              <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 space-y-4 text-sm">
                <div>
                  <span className="text-gray-400 font-medium block">Email Address</span>
                  <span className="font-semibold text-gray-800">{customer.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Phone Number</span>
                  <span className="font-semibold text-gray-800">{customer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Secondary Phone</span>
                  <span className="font-semibold text-gray-800">{customer.secondary_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Service Address</span>
                  <span className="font-semibold text-gray-800">{customer.service_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Billing Address</span>
                  <span className="font-semibold text-gray-800">{customer.billing_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">City / State / ZIP</span>
                  <span className="font-semibold text-gray-800">{customer.city} {customer.state} {customer.zip_code}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Preferred Contact Method</span>
                  <span className="font-semibold uppercase tracking-wider text-emerald-800 text-xs">{customer.preferred_contact_method}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>Assigned Crew & Admins</span>
              </h2>
              {isGlobal ? (
                <form action={handleAssignAdmin} className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Assign Employee / Admin</label>
                    <select
                      name="admin_id"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Select Employee...</option>
                      {teamList?.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg uppercase tracking-wide transition shadow"
                  >
                    Add Assignment
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                  You are assigned to manage this client account. Contact Global Admin to add more personnel.
                </div>
              )}

              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Current Personnel Assigned</span>
                {!currentAssignments || currentAssignments.length === 0 ? (
                  <p className="text-gray-500 text-xs">No employees assigned to this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {currentAssignments.map(asg => (
                      <div key={asg.id} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-800">{(asg.profiles as any)?.full_name}</span>
                        {isGlobal && (
                          <form action={handleRemoveAssign.bind(null, asg.admin_id)}>
                            <button
                              type="submit"
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>Scheduled Appointments</span>
              </h2>
              {!appointments || appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">No scheduled tasks or arborist visits.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{apt.title}</h4>
                        <span className="text-xs text-gray-500 block mt-0.5">
                          Start: {new Date(apt.start_time).toLocaleString()}
                        </span>
                        {apt.appointment_notes && (
                          <p className="text-gray-600 text-xs mt-1 italic">&ldquo;{apt.appointment_notes}&rdquo;</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{apt.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-emerald-600" />
                <span>Schedule Appointment</span>
              </h3>
              <form action={handleAddAppointment} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Appointment Title</label>
                  <input name="title" required type="text" placeholder="e.g. Oak Tree Pruning" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Start Date & Time</label>
                  <input name="start_time" required type="datetime-local" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">End Date & Time</label>
                  <input name="end_time" required type="datetime-local" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Assigned Employee</label>
                  <select name="assigned_admin_id" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="">Select...</option>
                    {teamList?.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Internal Notes</label>
                  <textarea name="notes" rows={3} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"></textarea>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider shadow">
                  Book Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'work' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                <span>Work Records Catalog</span>
              </h2>
              {!workRecords || workRecords.length === 0 ? (
                <p className="text-gray-500 text-sm">No ongoing tree removal or arborist jobs logged.</p>
              ) : (
                <div className="space-y-4">
                  {workRecords.map(work => (
                    <div key={work.id} className="p-4 bg-slate-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 text-sm">{work.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{work.status}</span>
                      </div>
                      {work.description && <p className="text-gray-600 text-xs mt-1">{work.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-emerald-600" />
                <span>Log New Work Record</span>
              </h3>
              <form action={handleAddWorkRecord} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Work Title</label>
                  <input name="title" required type="text" placeholder="e.g. Canopy Trim & Stumping" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Description</label>
                  <textarea name="description" rows={3} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"></textarea>
                </div>
                <div>
                  <label className="block mb-1">Assigned Crew Member</label>
                  <select name="assigned_employee_id" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="">Select...</option>
                    {teamList?.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider shadow">
                  Create Work Record
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Team Updates & Client Notes</span>
              </h2>
              {!notes || notes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes have been logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-gray-100 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800">{(note.profiles as any)?.full_name || 'System'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          note.visibility === 'customer' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {note.visibility}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">&ldquo;{note.content}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-emerald-600" />
                <span>Add Customer Note</span>
              </h3>
              <form action={handleAddNote} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Visibility Level</label>
                  <select name="visibility" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="internal">Internal (Only Admins / Employees)</option>
                    <option value="customer">Customer Visible (Available on Portal)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Note Content</label>
                  <textarea name="content" rows={4} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"></textarea>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider shadow">
                  Save Note
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'docs' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Documents & Shared Receipts</span>
              </h2>
              {!documents || documents.length === 0 ? (
                <p className="text-gray-500 text-sm">No documents on file.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-bold text-gray-800 block truncate max-w-[200px]">{doc.original_filename}</span>
                        <span className="text-xs text-gray-400 block uppercase font-bold text-[10px]">{doc.document_type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.customer_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {doc.customer_visible ? 'Visible on Portal' : 'Internal Only'}
                        </span>
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/customer-documents/${doc.storage_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 font-bold text-xs"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-emerald-600" />
                <span>Link Uploaded Document</span>
              </h3>
              <form action={handleAddDocument} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Document Type</label>
                  <select name="document_type" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="receipt">Receipt</option>
                    <option value="estimate">Estimate</option>
                    <option value="invoice">Invoice</option>
                    <option value="contract">Service Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Original Filename</label>
                  <input name="filename" required placeholder="e.g. invoice-4029.pdf" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Storage Path / File Link</label>
                  <input name="path" required placeholder="e.g. receipts/invoice-4029.pdf" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Customer Visibility</label>
                  <select name="customer_visible" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="false">Internal Only (Staff Only)</option>
                    <option value="true">Visible to Customer (Share on Portal)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider shadow">
                  Save Doc Reference
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'financials' && isGlobal && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>Financial Ledger & Billing history</span>
              </h2>
              {!financials || financials.length === 0 ? (
                <p className="text-gray-500 text-sm">No ledger entries recorded on file.</p>
              ) : (
                <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider pb-3">
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Portal Vis</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {financials.map(rec => (
                        <tr key={rec.id}>
                          <td className="py-3.5 font-bold text-gray-900">{rec.record_type}</td>
                          <td className="py-3.5">{rec.description}</td>
                          <td className="py-3.5 font-bold">${(rec.amount_in_cents / 100).toFixed(2)}</td>
                          <td className="py-3.5 uppercase font-semibold text-[10px]">
                            {rec.customer_visible ? (
                              <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Yes</span>
                            ) : (
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md">No</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{rec.payment_status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-emerald-600" />
                <span>Log Financial Record</span>
              </h3>
              <form action={handleAddFinancial} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Transaction Type</label>
                  <select name="record_type" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="Invoice">Invoice</option>
                    <option value="Estimate">Estimate</option>
                    <option value="Payment">Payment</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Description</label>
                  <input name="description" required placeholder="e.g. Complete oak removal" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Amount ($ USD)</label>
                  <input name="amount" required type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block mb-1">Payment Status</label>
                  <select name="payment_status" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Share on Customer Portal?</label>
                  <select name="customer_visible" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
                    <option value="false">Keep Internal (Staff Only)</option>
                    <option value="true">Share to Customer</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider shadow">
                  Commit Record
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
