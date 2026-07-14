import React from 'react';
import Link from 'next/link';
import { TreePine } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-white font-extrabold text-xl mb-4">
            <TreePine className="h-6 w-6 text-emerald-500" />
            <span>Trinity Tree</span>
          </div>
          <p className="text-sm">
            Providing premium, professional tree removal, pruning, and landscape management with strict adherence to absolute safety and complete customer delight.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link href="/gallery" className="hover:text-white transition">Gallery Portfolio</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Client Login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">Support & Office</h3>
          <ul className="space-y-2 text-sm">
            <li>Phone: <span className="text-gray-300 font-medium">(800) 555-0199</span></li>
            <li>Email: <span className="text-gray-300 font-medium">contact@trinitytree.com</span></li>
            <li>HQ: <span className="text-gray-300 font-medium">100 Trinity Way, Chicago, IL 60611</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-800 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Trinity Tree. All rights reserved. Built with the highest safety standards.</p>
      </div>
    </footer>
  );
}
