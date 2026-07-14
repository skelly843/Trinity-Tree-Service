import React from 'react';
import Link from 'next/link';

interface Block {
  id: string;
  block_type: string;
  heading?: string;
  body?: string;
  image_path?: string;
  image_alt_text?: string;
  button_label?: string;
  button_url?: string;
  alignment: 'left' | 'center' | 'right';
  config?: any;
}

export function CmsBlocks({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No content sections added yet.
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {blocks.map((block) => {
        const alignClass =
          block.alignment === 'center'
            ? 'text-center items-center'
            : block.alignment === 'right'
            ? 'text-right items-end'
            : 'text-left items-start';

        switch (block.block_type) {
          case 'heading':
            return (
              <section key={block.id} className={`py-12 max-w-4xl mx-auto px-4 flex flex-col ${alignClass}`}>
                {block.heading && (
                  <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-950 tracking-tight mb-4">
                    {block.heading}
                  </h1>
                )}
                {block.body && (
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                    {block.body}
                  </p>
                )}
                {block.button_label && block.button_url && (
                  <Link
                    href={block.button_url}
                    className="mt-6 inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition"
                  >
                    {block.button_label}
                  </Link>
                )}
              </section>
            );

          case 'paragraph':
            return (
              <section key={block.id} className="py-8 max-w-3xl mx-auto px-4">
                <div className={`flex flex-col ${alignClass}`}>
                  {block.heading && (
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {block.heading}
                    </h2>
                  )}
                  {block.body && (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {block.body}
                    </p>
                  )}
                </div>
              </section>
            );

          case 'image':
            return (
              <section key={block.id} className="py-8 max-w-4xl mx-auto px-4">
                <div className="flex flex-col items-center">
                  {block.image_path && (
                    <img
                      src={block.image_path}
                      alt={block.image_alt_text || block.heading || 'Content Image'}
                      className="rounded-xl shadow-lg max-h-[450px] w-full object-cover"
                    />
                  )}
                  {block.heading && (
                    <h3 className="text-lg font-semibold text-gray-800 mt-3">
                      {block.heading}
                    </h3>
                  )}
                  {block.body && <p className="text-gray-600 mt-1 text-sm">{block.body}</p>}
                </div>
              </section>
            );

          case 'image_text':
            const isLeft = block.alignment !== 'right';
            return (
              <section key={block.id} className="py-12 max-w-6xl mx-auto px-4">
                <div className={`grid md:grid-cols-2 gap-8 items-center`}>
                  <div className={isLeft ? 'order-1 md:order-1' : 'order-1 md:order-2'}>
                    {block.image_path && (
                      <img
                        src={block.image_path}
                        alt={block.image_alt_text || block.heading || 'Feature Image'}
                        className="rounded-xl shadow-md w-full h-[350px] object-cover"
                      />
                    )}
                  </div>
                  <div className={isLeft ? 'order-2 md:order-2' : 'order-2 md:order-1'}>
                    {block.heading && (
                      <h2 className="text-3xl font-bold text-emerald-950 mb-4">
                        {block.heading}
                      </h2>
                    )}
                    {block.body && (
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {block.body}
                      </p>
                    )}
                    {block.button_label && block.button_url && (
                      <Link
                        href={block.button_url}
                        className="inline-flex items-center px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg shadow transition"
                      >
                        {block.button_label}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );

          case 'cta':
            return (
              <section key={block.id} className="py-12 bg-emerald-900 text-white rounded-2xl max-w-5xl mx-auto px-6 md:px-12 my-8 shadow-xl">
                <div className={`flex flex-col ${alignClass}`}>
                  {block.heading && (
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                      {block.heading}
                    </h2>
                  )}
                  {block.body && (
                    <p className="text-emerald-100 max-w-2xl mb-6">
                      {block.body}
                    </p>
                  )}
                  {block.button_label && block.button_url && (
                    <Link
                      href={block.button_url}
                      className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-lg shadow-md transition"
                    >
                      {block.button_label}
                    </Link>
                  )}
                </div>
              </section>
            );

          case 'divider':
            return <hr key={block.id} className="border-t border-gray-200 max-w-4xl mx-auto my-12" />;

          case 'contact':
            return (
              <section key={block.id} className="py-12 max-w-xl mx-auto px-4 text-center">
                {block.heading && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{block.heading}</h2>
                )}
                {block.body && <p className="text-gray-600 mb-6">{block.body}</p>}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 shadow-sm flex flex-col space-y-2 text-emerald-900">
                  <span className="font-semibold">Call Support:</span>
                  <span className="text-xl font-bold">(800) 555-0199</span>
                  <span className="font-semibold mt-2">Email:</span>
                  <span className="text-lg">contact@trinitytree.com</span>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
