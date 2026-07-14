import React from 'react';
import { createClient } from '@/utils/supabase/server';
import {
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  ClipboardList,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch current user details
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobal = profile?.role === 'global_admin';

  let totalActiveCustomers = 0;
  let upcomingAppointmentsCount = 0;
  let outstandingBalances = 0;
  let assignedCount = 0;
  let unassignedCount = 0;

  let customersList: any[] = [];
  let appointmentsList: any[] = [];
  let notesList: any[] = [];
  let workRecordsList: any[] = [];

  try {
    if (isGlobal) {
      // 1. Fetch statistics for Global Admin
      const { count: activeCust } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active');
      totalActiveCustomers = activeCust || 0;

      const { data: fetchApts } = await supabase
        .from('appointments')
        .select('*, customers(full_name)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      appointmentsList = fetchApts || [];
      upcomingAppointmentsCount = appointmentsList.length;

      const { data: financials } = await supabase
        .from('financial_records')
        .select('amount_in_cents, record_type, payment_status');

      const unpaidInvoices = financials
        ?.filter(f => f.record_type === 'Invoice' && f.payment_status !== 'Paid')
        ?.reduce((sum, f) => sum + f.amount_in_cents, 0) || 0;
      outstandingBalances = unpaidInvoices;

      // Calculate assignment split
      const { data: allCusts } = await supabase
        .from('customers')
        .select('id, admin_customer_assignments(admin_id)');

      if (allCusts) {
        allCusts.forEach(c => {
          if (c.admin_customer_assignments && c.admin_customer_assignments.length > 0) {
            assignedCount++;
          } else {
            unassignedCount++;
          }
        });
      }

      const { data: fetchNotes } = await supabase
        .from('customer_notes')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      notesList = fetchNotes || [];

      const { data: fetchCusts } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      customersList = fetchCusts || [];

    } else {
      // 2. Fetch statistics for Normal Admin (Assigned data only)
      // Get assigned customer IDs
      const { data: assignments } = await supabase
        .from('admin_customer_assignments')
        .select('customer_id')
        .eq('admin_id', user.id);

      const assignedIds = assignments?.map(a => a.customer_id) || [];

      if (assignedIds.length > 0) {
        const { count: activeCust } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .in('id', assignedIds)
          .eq('account_status', 'active');
        totalActiveCustomers = activeCust || 0;

        const { data: fetchApts } = await supabase
          .from('appointments')
          .select('*, customers(full_name)')
          .in('customer_id', assignedIds)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);
        appointmentsList = fetchApts || [];
        upcomingAppointmentsCount = appointmentsList.length;

        const { data: fetchNotes } = await supabase
          .from('customer_notes')
          .select('*, customers(full_name)')
          .in('customer_id', assignedIds)
          .order('created_at', { ascending: false })
          .limit(5);
        notesList = fetchNotes || [];

        const { data: fetchWork } = await supabase
          .from('work_records')
          .select('*, customers(full_name)')
          .in('customer_id', assignedIds)
          .order('created_at', { ascending: false })
          .limit(5);
        workRecordsList = fetchWork || [];
      }
    }
  } catch (err) {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Real-time status of customers, appointments, and operations.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-50 rounded-lg text-emerald-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Active Customers</span>
            <span className="text-2xl font-bold text-gray-900">{totalActiveCustomers}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
          <div className="p-3.5 bg-blue-50 rounded-lg text-blue-700">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Upcoming Tasks</span>
            <span className="text-2xl font-bold text-gray-900">{upcomingAppointmentsCount}</span>
          </div>
        </div>

        {isGlobal ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
            <div className="p-3.5 bg-amber-50 rounded-lg text-amber-700">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Outstanding Balances</span>
              <span className="text-2xl font-bold text-gray-900">${(outstandingBalances / 100).toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
            <div className="p-3.5 bg-amber-50 rounded-lg text-amber-700">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Assigned Customers</span>
              <span className="text-2xl font-bold text-gray-900">{totalActiveCustomers}</span>
            </div>
          </div>
        )}

        {isGlobal ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
            <div className="p-3.5 bg-rose-50 rounded-lg text-rose-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Assignments Ratio</span>
              <span className="text-sm font-bold text-gray-900">{assignedCount} Assigned / {unassignedCount} Free</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 flex items-center space-x-4">
            <div className="p-3.5 bg-rose-50 rounded-lg text-rose-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Team Note Updates</span>
              <span className="text-2xl font-bold text-gray-900">{notesList.length}</span>
            </div>
          </div>
        )}

      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Appointments card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
          <h3 className="font-bold text-gray-900 text-md mb-4 flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600" />
            <span>Upcoming Appointments</span>
          </h3>
          {appointmentsList.length === 0 ? (
            <p className="text-gray-500 text-sm">No scheduled tasks at this time.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointmentsList.map(apt => (
                <div key={apt.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <h4 className="font-bold text-gray-800">{apt.title}</h4>
                    <span className="text-xs text-gray-400">
                      Customer: <span className="font-medium text-gray-600">{(apt.customers as any)?.full_name || 'Guest'}</span>
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold">
                    {new Date(apt.start_time).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
          <h3 className="font-bold text-gray-900 text-md mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <span>Recent Activity & Updates</span>
          </h3>
          {notesList.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent operations logs available.</p>
          ) : (
            <div className="space-y-4">
              {notesList.map(note => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-lg border border-gray-100 text-sm">
                  <p className="text-gray-700 text-xs italic">&ldquo;{note.content}&rdquo;</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                    <span>Customer: {(note.customers as any)?.full_name}</span>
                    <span className="uppercase font-bold text-emerald-800">{note.visibility}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
