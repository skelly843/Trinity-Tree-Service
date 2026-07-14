import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

export const revalidate = 0;

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string; admin?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobal = profile?.role === 'global_admin';

  const { data: admins } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['global_admin', 'admin']);

  let assignedCustIds: string[] = [];
  if (!isGlobal) {
    const { data: userAssignments } = await supabase
      .from('admin_customer_assignments')
      .select('customer_id')
      .eq('admin_id', user.id);
    assignedCustIds = userAssignments?.map(a => a.customer_id) || [];
  }

  let query = supabase.from('customers').select('*', { count: 'exact' });

  if (searchParams.search) {
    query = query.ilike('full_name', `%${searchParams.search}%`);
  }

  if (searchParams.filter) {
    query = query.eq('account_status', searchParams.filter);
  }

  if (!isGlobal) {
    if (assignedCustIds.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customers</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center">
            <p className="text-gray-500">You are not currently assigned to any customer accounts.</p>
          </div>
        </div>
      );
    }
    query = query.in('id', assignedCustIds);
  } else if (searchParams.admin) {
    const { data: assignedCusts } = await supabase
      .from('admin_customer_assignments')
      .select('customer_id')
      .eq('admin_id', searchParams.admin);
    const filterCustIds = assignedCusts?.map(a => a.customer_id) || [];
    query = query.in('id', filterCustIds);
  }

  const { data: customers } = await query;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customer Accounts</h1>
          <p className="text-gray-500 mt-1">Manage and assign professional customer accounts.</p>
        </div>
        {isGlobal && (
          <Link
            href="/admin/customers/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition text-sm"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Create Customer</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4">
        <form className="grid sm:grid-cols-3 gap-4" method="GET" action="/admin/customers">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <select
              name="filter"
              defaultValue={searchParams.filter || ''}
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="disabled">Disabled Accounts</option>
            </select>
          </div>

          {isGlobal && (
            <div className="flex space-x-2">
              <select
                name="admin"
                defaultValue={searchParams.admin || ''}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">All Employee/Admin Assignments</option>
                {admins?.map(adm => (
                  <option key={adm.id} value={adm.id}>{adm.full_name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-900 text-white font-semibold rounded-lg hover:bg-emerald-800 transition text-sm"
              >
                Apply
              </button>
            </div>
          )}
        </form>
      </div>

      {!customers || customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center text-gray-500">
          No customer accounts found matching current query filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Detail</th>
                  <th className="p-4">Service Address</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-gray-900">{cust.full_name}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{cust.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-start space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>
                          {cust.service_address || 'No service address'}<br />
                          {cust.city && `${cust.city}, `} {cust.state}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cust.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cust.account_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/customers/${cust.id}`}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        Open Workspace
                      </Link>
                    </td>
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
