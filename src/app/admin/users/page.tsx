'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createAdminAccount, updateUserAccountStatus } from '@/actions/auth';
import { Loader2, ShieldCheck, UserCheck } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['global_admin', 'admin']);
      if (data) {
        setUsers(data);
      }
    }
    fetchUsers();
  }, [supabase]);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      role: formData.get('role'),
      accountStatus: 'active',
    };

    try {
      const result = await createAdminAccount(data);
      if (result.success) {
        setSuccessMsg('Successfully created admin / employee credential.');
        e.currentTarget.reset();
        const { data: updated } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['global_admin', 'admin']);
        if (updated) setUsers(updated);
      } else {
        setErrorMsg(result.error || 'Failed to register account.');
      }
    } catch (err) {
      setErrorMsg('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const result = await updateUserAccountStatus(userId, nextStatus);
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, account_status: nextStatus } : u));
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Failed to modify account status.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-gray-500 mt-1">Provision and govern arborist and administrator accounts.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 h-fit">
          <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Create Admin / Employee</span>
          </h2>

          {errorMsg && <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">{errorMsg}</div>}
          {successMsg && <div className="p-3 mb-4 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100">{successMsg}</div>}

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold text-gray-600">
            <div>
              <label className="block mb-1">Full Name</label>
              <input name="fullName" required type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block mb-1">Email Address</label>
              <input name="email" required type="email" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block mb-1">Privilege Role</label>
              <select name="role" required className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs bg-white">
                <option value="admin">Admin / Employee</option>
                <option value="global_admin">Global Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs rounded-lg tracking-wider transition shadow disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Register User</span>
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
          <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <span>Active Administrators & Crew</span>
          </h2>
          <div className="divide-y divide-gray-100 text-sm">
            {users.map(u => (
              <div key={u.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">{u.full_name}</h4>
                  <span className="text-xs text-gray-400 font-medium block mt-0.5">{u.email}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                    {u.role.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleStatusChange(u.id, u.account_status)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      u.account_status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {u.account_status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
