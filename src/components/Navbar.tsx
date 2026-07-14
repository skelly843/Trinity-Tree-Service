'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/actions/auth';
import { TreePine, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) setRole(profile.role);
      }
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) setRole(profile.role);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await logout();
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="bg-emerald-950 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-extrabold tracking-tight">
              <TreePine className="h-8 w-8 text-emerald-400" />
              <span>Trinity Tree</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-emerald-300 font-medium transition">Home</Link>
            <Link href="/about" className="hover:text-emerald-300 font-medium transition">About</Link>
            <Link href="/gallery" className="hover:text-emerald-300 font-medium transition">Gallery</Link>

            {user ? (
              <>
                {role === 'customer' ? (
                  <Link href="/portal" className="bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-lg font-medium transition">Customer Portal</Link>
                ) : (
                  <Link href="/admin" className="bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-lg font-medium transition">Admin Panel</Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="hover:text-emerald-300 font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-semibold transition"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-emerald-300 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-emerald-900 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          <Link href="/" className="block px-3 py-2 rounded-md hover:bg-emerald-800 font-medium">Home</Link>
          <Link href="/about" className="block px-3 py-2 rounded-md hover:bg-emerald-800 font-medium">About</Link>
          <Link href="/gallery" className="block px-3 py-2 rounded-md hover:bg-emerald-800 font-medium">Gallery</Link>
          {user ? (
            <>
              {role === 'customer' ? (
                <Link href="/portal" className="block px-3 py-2 rounded-md bg-emerald-700 font-medium">Customer Portal</Link>
              ) : (
                <Link href="/admin" className="block px-3 py-2 rounded-md bg-emerald-700 font-medium">Admin Panel</Link>
              )}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md hover:bg-emerald-800 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block text-center px-3 py-2 rounded-md bg-emerald-600 font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
