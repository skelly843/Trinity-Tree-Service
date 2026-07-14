import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Calendar as CalendarIcon, MapPin, User, Clock } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminCalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobal = profile?.role === 'global_admin';

  let appointments: any[] = [];

  try {
    if (isGlobal) {
      const { data } = await supabase
        .from('appointments')
        .select('*, customers(full_name)')
        .order('start_time', { ascending: true });
      appointments = data || [];
    } else {
      const { data: assignments } = await supabase
        .from('admin_customer_assignments')
        .select('customer_id')
        .eq('admin_id', user.id);

      const assignedIds = assignments?.map(a => a.customer_id) || [];
      if (assignedIds.length > 0) {
        const { data } = await supabase
          .from('appointments')
          .select('*, customers(full_name)')
          .in('customer_id', assignedIds)
          .order('start_time', { ascending: true });
        appointments = data || [];
      }
    }
  } catch (err) {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Calendar</h1>
        <p className="text-gray-500 mt-1">
          Chronological grid and operational calendar schedule. Consistent with arborist timezone: America/Chicago.
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center text-gray-500">
          No appointments are currently scheduled.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full tracking-wider uppercase">
                  {apt.status}
                </span>
                <h3 className="font-extrabold text-gray-900 text-md mt-3 mb-1">{apt.title}</h3>
                <div className="space-y-2 mt-4 text-xs text-gray-600 font-semibold">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Client: {(apt.customers as any)?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{new Date(apt.start_time).toLocaleString('en-US', { timeZone: 'America/Chicago' })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{apt.service_address || 'No service address logged'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/admin/customers/${apt.customer_id}?tab=appointments`}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Manage Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
