import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { CmsBlocks } from '@/components/CmsBlocks';

export const revalidate = 0;

export default async function AboutPage() {
  const supabase = createClient();
  let blocks: any[] = [];

  try {
    const { data: page } = await supabase
      .from('website_pages')
      .select('id')
      .eq('name', 'about')
      .single();

    if (page) {
      const { data: fetchBlocks } = await supabase
        .from('website_content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .eq('published_status', true)
        .order('sort_order', { ascending: true });

      if (fetchBlocks) {
        blocks = fetchBlocks;
      }
    }
  } catch (err) {}

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-emerald-950">About Trinity Tree</h1>
        <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
          Providing high-altitude pruning, technical removals, and safe tree management services with unmatched integrity.
        </p>
      </div>

      <CmsBlocks blocks={blocks} />

      <div className="max-w-4xl mx-auto px-4 mt-16 bg-slate-50 rounded-2xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Our Core Values</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-emerald-800 text-lg mb-1">Environmental Protection</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We preserve healthy trees whenever possible and practice soil restoration to support native plant systems.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 text-lg mb-1">Safety Above All</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We use advanced arborist rigging gear and personal protective equipment to ensure zero property risk.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 text-lg mb-1">Full Accountability</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We do not close work or accept payments until the client is fully satisfied with the site cleanup.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 text-lg mb-1">Trained Arborists</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Continuous educational training keeps our crews at the leading edge of modern arborist best-practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
