import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Edit3,
  ShieldAlert,
  Settings,
  LogOut,
  UserCheck,
  ClipboardList
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch role and account status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, account_status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.account_status === 'disabled') {
    redirect('/unauthorized');
  }

  const role = profile.role;
  if (role !== 'global_admin' && role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-emerald-950 text-emerald-100 flex flex-col p-6 shrink-0 shadow-lg border-r border-emerald-900">
        <div className="mb-8">
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs block">Workspace</span>
          <h2 className="text-xl font-extrabold text-white mt-1">Trinity Tree</h2>
          <div className="mt-3 p-3 bg-emerald-900/50 rounded-lg border border-emerald-800">
            <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
            <span className="text-[10px] text-emerald-300 font-bold uppercase block mt-0.5">{role.replace('_', ' ')}</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-grow">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
            <LayoutDashboard className="h-4.5 w-4.5 text-emerald-400" />
            <span>Overview</span>
          </Link>
          <Link href="/admin/calendar" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
            <Calendar className="h-4.5 w-4.5 text-emerald-400" />
            <span>Calendar</span>
          </Link>
          <Link href="/admin/customers" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
            <Users className="h-4.5 w-4.5 text-emerald-400" />
            <span>Customers</span>
          </Link>
          <Link href="/admin/work" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
            <ClipboardList className="h-4.5 w-4.5 text-emerald-400" />
            <span>Work Records</span>
          </Link>

          {role === 'global_admin' && (
            <>
              <div className="pt-6 pb-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">CMS & Admin</div>
              <Link href="/admin/content/home" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
                <Edit3 className="h-4.5 w-4.5 text-emerald-400" />
                <span>Homepage Blocks</span>
              </Link>
              <Link href="/admin/content/about" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
                <Edit3 className="h-4.5 w-4.5 text-emerald-400" />
                <span>About Page Blocks</span>
              </Link>
              <Link href="/admin/users" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
                <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
                <span>User Management</span>
              </Link>
              <Link href="/admin/audit" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
                <ShieldAlert className="h-4.5 w-4.5 text-emerald-400" />
                <span>Audit Logs</span>
              </Link>
            </>
          )}

          <div className="pt-6 pb-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">General</div>
          <Link href="/admin/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm">
            <Settings className="h-4.5 w-4.5 text-emerald-400" />
            <span>Settings</span>
          </Link>
          <Link href="/" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition font-medium text-sm text-emerald-300">
            <LogOut className="h-4.5 w-4.5" />
            <span>Go to Public Site</span>
          </Link>
        </nav>
      </aside>

      {/* Main content viewport */}
      <main className="flex-grow p-6 md:p-10">
        {children}
      </main>

    </div>
  );
}
