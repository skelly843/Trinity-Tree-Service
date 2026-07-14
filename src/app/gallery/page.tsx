import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Image as ImageIcon } from 'lucide-react';

export const revalidate = 0;

export default async function GalleryPage() {
  const supabase = createClient();
  let photos: any[] = [];
  let errorMsg = '';

  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('published_status', true)
      .order('display_order', { ascending: true });

    if (error) {
      errorMsg = error.message;
    } else if (data) {
      photos = data;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-emerald-950">Project Gallery</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            A real-time catalog of our tree pruning, storm management, and complete removal operations.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center my-4">
            {errorMsg}
          </div>
        )}

        {photos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Gallery Images Found</h3>
            <p className="text-gray-500 text-sm">Please check back later as we update our portfolio.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={
                      photo.storage_path.startsWith('http')
                        ? photo.storage_path
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-gallery/${photo.storage_path}`
                    }
                    alt={photo.alt_text || photo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=400';
                    }}
                  />
                  {photo.category && (
                    <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {photo.category}
                    </span>
                  )}
                  {photo.is_cover && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Cover Project
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{photo.title}</h3>
                  {photo.caption && <p className="text-gray-600 text-sm">{photo.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
