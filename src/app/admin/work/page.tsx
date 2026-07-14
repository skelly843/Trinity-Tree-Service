import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { User } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminWorkRecordsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobal = profile?.role === 'global_admin';

  let workRecords: any[] = [];

  try {
    if (isGlobal) {
      const { data } = await supabase
        .from('work_records')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false });
      workRecords = data || [];
    } else {
      const { data: assignments } = await supabase
        .from('admin_customer_assignments')
        .select('customer_id')
        .eq('admin_id', user.id);

      const assignedIds = assignments?.map(a => a.customer_id) || [];
      if (assignedIds.length > 0) {
        const { data } = await supabase
          .from('work_records')
          .select('*, customers(full_name)')
          .in('customer_id', assignedIds)
          .order('created_at', { ascending: false });
        workRecords = data || [];
      }
    }
  } catch (err) {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Work Records Catalog</h1>
        <p className="text-gray-500 mt-1">Catalog of completed and scheduled tree and landscape operations.</p>
      </div>

      {workRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center text-gray-500">
          No active work logs or completed tree operations.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workRecords.map(work => (
            <div key={work.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full tracking-wider uppercase">
                  {work.status}
                </span>
                <h3 className="font-extrabold text-gray-900 text-md mt-3 mb-1">{work.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed mb-4">{work.description || 'No description logged'}</p>

                <div className="space-y-2 text-xs text-gray-500 font-medium">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 shrink-0" />
                    <span>Customer: {(work.customers as any)?.full_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/admin/customers/${work.customer_id}?tab=work`}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Open Workspace
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
