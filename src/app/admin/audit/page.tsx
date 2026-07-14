import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Clock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminAuditPage() {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Immutably log critical administrator, customer, and billing actions.</p>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center text-gray-500">
          No audit logs on record.
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-gray-300" />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {(log.profiles as any)?.full_name || 'System / Guest'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold uppercase text-[9px]">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 uppercase text-[9px] tracking-wide text-gray-400 font-bold">{log.entity_type}</td>
                    <td className="p-4 text-gray-600 font-medium">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
