import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  User as UserIcon,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  FileImage,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function CustomerPortalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.account_status === 'disabled') {
    redirect('/unauthorized');
  }

  // Fetch linked customer record
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (!customer) {
    return (
      <div className="py-12 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <HelpCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Linked Customer Profile</h2>
          <p className="text-gray-600 text-sm mb-6">
            An administrator has not yet linked your credentials to a professional customer account. Please contact support.
          </p>
          <span className="text-xs text-gray-400 font-mono">User ID: {user.id}</span>
        </div>
      </div>
    );
  }

  // Fetch user appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('customer_id', customer.id)
    .order('start_time', { ascending: false });

  // Fetch work records
  const { data: workRecords } = await supabase
    .from('work_records')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  // Fetch notes
  const { data: notes } = await supabase
    .from('customer_notes')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('visibility', 'customer')
    .order('created_at', { ascending: false });

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('customer_visible', true)
    .order('created_at', { ascending: false });

  // Fetch visible financial records
  const { data: financials } = await supabase
    .from('financial_records')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('customer_visible', true)
    .order('transaction_date', { ascending: false });

  // Calculate unpaid balances safely
  const unpaidInvoices = financials
    ?.filter(f => f.record_type === 'Invoice' && f.payment_status !== 'Paid')
    ?.reduce((sum, f) => sum + f.amount_in_cents, 0) || 0;

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Summary */}
        <div className="bg-emerald-950 text-white rounded-2xl p-8 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Client Space</span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">Hello, {customer.full_name}</h1>
              <p className="text-emerald-100 text-sm mt-1">Welcome to your secure Trinity Tree customer workspace.</p>
            </div>
            <div className="bg-emerald-900 border border-emerald-800 rounded-xl p-4 flex items-center space-x-4">
              <DollarSign className="h-10 w-10 text-emerald-400" />
              <div>
                <span className="text-xs text-emerald-300 uppercase font-bold block">Outstanding Balance</span>
                <span className="text-2xl font-bold">${(unpaidInvoices / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main Content Workspace Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Appointments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <span>My Appointments</span>
                </h2>
              </div>
              {!appointments || appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">No scheduled or past appointments on file.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{apt.title}</h4>
                        <span className="text-xs text-gray-500 block mt-0.5">
                          {new Date(apt.start_time).toLocaleString('en-US', { timeZone: process.env.NEXT_PUBLIC_APP_TIMEZONE })}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Summaries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 mb-6">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                <span>My Work Records & Summaries</span>
              </h2>
              {!workRecords || workRecords.length === 0 ? (
                <p className="text-gray-500 text-sm">No active tree maintenance or landscaping work logs.</p>
              ) : (
                <div className="space-y-4">
                  {workRecords.slice(0, 3).map(work => (
                    <div key={work.id} className="p-4 bg-slate-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{work.title}</h4>
                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">{work.status}</span>
                      </div>
                      {work.customer_visible_summary && (
                        <p className="text-gray-600 text-xs leading-relaxed">{work.customer_visible_summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices, Payments, Financials */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 mb-6">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>My Financials & Invoices</span>
              </h2>
              {!financials || financials.length === 0 ? (
                <p className="text-gray-500 text-sm">No client-visible financial logs available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-medium">
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {financials.map(rec => (
                        <tr key={rec.id} className="text-gray-700">
                          <td className="py-3 font-medium">{rec.customer_visible_description || rec.description}</td>
                          <td className="py-3">{rec.record_type}</td>
                          <td className="py-3 font-semibold">${(rec.amount_in_cents / 100).toFixed(2)}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                              {rec.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-8">

            {/* Account Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                <span>My Information</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{customer.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-start space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>
                    {customer.service_address || 'No service address provided'}<br />
                    {customer.city && `${customer.city}, `} {customer.state} {customer.zip_code}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents & Receipts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>My Documents</span>
              </h3>
              {!documents || documents.length === 0 ? (
                <p className="text-gray-500 text-xs">No customer documents shared yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-800 block truncate max-w-[150px]">{doc.original_filename}</span>
                        <span className="text-gray-500 block uppercase font-medium mt-0.5 text-[10px]">{doc.document_type}</span>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/customer-documents/${doc.storage_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Team Updates</span>
              </h3>
              {!notes || notes.length === 0 ? (
                <p className="text-gray-500 text-xs">No client-visible notes added.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">&ldquo;{note.content}&rdquo;</p>
                      <span className="text-gray-400 block mt-2 text-[10px]">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
