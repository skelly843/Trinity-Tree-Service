'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createContentBlock, updateContentBlock, deleteContentBlock } from '@/actions/cms';
import { Trash2 } from 'lucide-react';

export default function HomeCmsEditor() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [pageId, setPageId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadPageBlocks() {
      const { data: page } = await supabase
        .from('website_pages')
        .select('id')
        .eq('name', 'home')
        .single();

      if (page) {
        setPageId(page.id);
        const { data: fetchBlocks } = await supabase
          .from('website_content_blocks')
          .select('*')
          .eq('page_id', page.id)
          .order('sort_order', { ascending: true });
        if (fetchBlocks) {
          setBlocks(fetchBlocks);
        }
      }
    }
    loadPageBlocks();
  }, [supabase]);

  const handleAddBlock = async (type: string) => {
    if (!pageId) return;
    const newOrder = blocks.length;
    setIsLoading(true);
    try {
      const res = await createContentBlock({
        pageId,
        blockType: type,
        sortOrder: newOrder,
        heading: 'New Content Block',
        body: 'Specify custom descriptive paragraph contents here.',
        alignment: 'left',
        publishedStatus: true,
      });

      if (res.success) {
        const { data: fetchBlocks } = await supabase
          .from('website_content_blocks')
          .select('*')
          .eq('page_id', pageId)
          .order('sort_order', { ascending: true });
        if (fetchBlocks) setBlocks(fetchBlocks);
      }
    } catch (err) {}
    setIsLoading(false);
  };

  const handleUpdate = async (id: string, index: number, field: string, val: any) => {
    const updated = [...blocks];
    updated[index][field] = val;
    setBlocks(updated);

    await updateContentBlock(id, updated[index]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely certain you want to delete this block section?')) return;
    setIsLoading(true);
    const res = await deleteContentBlock(id);
    if (res.success) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Homepage Blocks CMS</h1>
        <p className="text-gray-500 mt-1">Safely reorder, structure, and design website page sections in real-time.</p>
      </div>

      <div className="flex space-x-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-fit">
        <button onClick={() => handleAddBlock('heading')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs text-slate-800 transition">
          + Add Heading Block
        </button>
        <button onClick={() => handleAddBlock('paragraph')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs text-slate-800 transition">
          + Add Paragraph Block
        </button>
        <button onClick={() => handleAddBlock('cta')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs text-slate-800 transition">
          + Add CTA Block
        </button>
        <button onClick={() => handleAddBlock('contact')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs text-slate-800 transition">
          + Add Contact Block
        </button>
      </div>

      <div className="space-y-6">
        {blocks.map((block, i) => (
          <div key={block.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/50 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wide bg-emerald-50 px-2 py-0.5 rounded">
                Block {i + 1}: {block.block_type}
              </span>
              <button
                onClick={() => handleDelete(block.id)}
                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
              <div>
                <label className="block mb-1">Section Heading</label>
                <input
                  type="text"
                  value={block.heading || ''}
                  onChange={(e) => handleUpdate(block.id, i, 'heading', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block mb-1">Alignment</label>
                <select
                  value={block.alignment}
                  onChange={(e) => handleUpdate(block.id, i, 'alignment', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs bg-white"
                >
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1">Section Body Content</label>
                <textarea
                  rows={3}
                  value={block.body || ''}
                  onChange={(e) => handleUpdate(block.id, i, 'body', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium"
                ></textarea>
              </div>

              {block.block_type === 'cta' && (
                <>
                  <div>
                    <label className="block mb-1">Button Label</label>
                    <input
                      type="text"
                      value={block.button_label || ''}
                      onChange={(e) => handleUpdate(block.id, i, 'button_label', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Button Destination (URL)</label>
                    <input
                      type="text"
                      value={block.button_url || ''}
                      onChange={(e) => handleUpdate(block.id, i, 'button_url', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
