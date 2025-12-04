'use client';

import { motion } from 'framer-motion';
import { BarChart3, PieChart, Activity } from 'lucide-react';

export function MiniChart({ type = 'line' }: { type?: 'line' | 'bar' | 'area' }) {
  return (
    <div className="relative w-full h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 overflow-hidden">
      {/* Simple visualization */}
      {type === 'line' && (
        <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 0,40 Q 50,20 100,30 T 200,15"
            fill="url(#lineGradient)"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      )}
      
      {type === 'bar' && (
        <div className="flex items-end justify-around h-full gap-1">
          {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t"
            />
          ))}
        </div>
      )}
      
      {type === 'area' && (
        <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 0,45 Q 25,30 50,35 T 100,25 T 150,30 T 200,20 L 200,60 L 0,60 Z"
            fill="url(#areaGradient)"
            stroke="rgb(16, 185, 129)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      )}
    </div>
  );
}

export function ActivityChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your writing progress this week
          </p>
        </div>
        <Activity className="w-5 h-5 text-blue-500" />
      </div>
      
      <MiniChart type="area" />
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">28.4K</p>
          <p className="text-xs text-gray-500">Words</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
          <p className="text-xs text-gray-500">Documents</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
          <p className="text-xs text-gray-500">Growth</p>
        </div>
      </div>
    </motion.div>
  );
}

export function QuickStats() {
  const stats = [
    { label: 'DUO', value: '$25.5 M', color: 'text-orange-500' },
    { label: 'SA', value: '$13.9 M', color: 'text-blue-500' },
    { label: 'INR', value: '$23 M', color: 'text-green-500' },
    { label: 'YAO', value: '$1 M', color: 'text-purple-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Documents
      </h3>
      
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stat.label}
              </span>
            </div>
            <span className={`font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
