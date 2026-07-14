import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { CmsBlocks } from '@/components/CmsBlocks';
import Link from 'next/link';
import { CheckCircle, Shield, Award } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  let blocks: any[] = [];

  try {
    const { data: page } = await supabase
      .from('website_pages')
      .select('id')
      .eq('name', 'home')
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
  } catch (err: any) {}

  return (
    <div className="pb-16">
      <div className="relative bg-emerald-950 text-white overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200')" }}></div>
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Trinity Tree Services
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-100 max-w-3xl mx-auto mb-8 font-light">
            Your premium neighborhood tree pruning, complete removals, and urgent storm clean-up experts. Absolute safety. Total integrity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/gallery"
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-lg shadow-md transition"
            >
              Explore Our Work
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-emerald-800 hover:bg-emerald-700 font-semibold rounded-lg shadow-md transition border border-emerald-600"
            >
              Customer Login
            </Link>
          </div>
        </div>
      </div>

      <div className="my-12">
        <CmsBlocks blocks={blocks} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why Customers Trust Trinity Tree</h2>
          <p className="text-gray-600 mt-2">Professional tree surgeons committed to absolute excellence</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-emerald-50 rounded-full mb-4">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Licensed & Fully Insured</h3>
            <p className="text-gray-600 text-sm">
              Complete multi-million liability insurance and workers compensation to protect your property and family.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-emerald-50 rounded-full mb-4">
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Certified Tree Surgeons</h3>
            <p className="text-gray-600 text-sm">
              Our specialists hold official qualifications and practice ISA tree trimming standards.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-emerald-50 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Customer First Pricing</h3>
            <p className="text-gray-600 text-sm">
              Detailed itemized estimates with upfront pricing. No sudden surprises or hidden overhead fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
