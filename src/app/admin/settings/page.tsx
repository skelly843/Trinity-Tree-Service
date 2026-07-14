import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Settings, Save } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('company_settings')
    .select('*');

  async function handleUpdateSettings(formData: FormData) {
    'use server';
    const supabase = createClient();

    formData.forEach(async (val, key) => {
      if (key.startsWith('setting_')) {
        const cleanKey = key.replace('setting_', '');
        await supabase
          .from('company_settings')
          .update({ value: val as string })
          .eq('key', cleanKey);
      }
    });
    revalidatePath('/admin/settings');
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure company-wide public labels, contact info, and security limits.</p>
      </div>

      <form action={handleUpdateSettings} className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
          <Settings className="h-5 w-5 text-emerald-600" />
          <span>Arborist Company Brand Details</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-sm">
          {settings?.map(set => {
            const label = set.key.replace('_', ' ');
            return (
              <div key={set.id} className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
                <input
                  name={`setting_${set.key}`}
                  defaultValue={set.value || ''}
                  type="text"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 text-sm"
                />
                <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{set.description}</span>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center space-x-2 text-sm"
        >
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </form>
    </div>
  );
}
