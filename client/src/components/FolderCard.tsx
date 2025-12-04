'use client';

import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import Link from 'next/link';

interface FolderCardProps {
  name: string;
  href?: string;
  count?: number;
}

export default function FolderCard({ name, href = '#', count }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="group"
    >
      <Link href={href}>
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          {/* Folder Icon */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl shadow-lg transform group-hover:shadow-xl transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-t-2xl" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Folder className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            {count !== undefined && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                {count}
              </div>
            )}
          </div>
          
          {/* Folder Name */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            {name}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
