import React from 'react';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 bg-slate-50 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
        <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
          <AlertOctagon className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          You are either not logged in, your user account does not possess the permitted role for this workspace, or your account has been disabled.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/login"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm"
          >
            Sign In Again
          </Link>
          <Link
            href="/"
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition text-sm"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
