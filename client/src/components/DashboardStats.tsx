'use client';

import { FileText, Users, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DocumentStats {
  wordCount: number;
  characterCount: number;
  lastEdited: string;
  collaborators: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-[#1A1F2E] border border-gray-800 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white mb-1">
            {value} f
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} shadow-lg`}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
          <span className="text-green-400 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardStats({ documentId }: { documentId?: string }) {
  const [stats, setStats] = useState<DocumentStats>({
    wordCount: 0,
    characterCount: 0,
    lastEdited: 'Just now',
    collaborators: 1,
  });

  useEffect(() => {
    // Update stats from editor content
    const updateStats = () => {
      const editor = document.querySelector('.ProseMirror');
      if (editor) {
        const text = editor.textContent || '';
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setStats(prev => ({
          ...prev,
          wordCount: words,
          characterCount: text.length,
        }));
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Word Count"
        value={stats.wordCount.toLocaleString()}
        subtitle="words written"
        icon={<FileText className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-blue-500 to-blue-600"
        trend="+12%"
      />
      
      <StatsCard
        title="Characters"
        value={stats.characterCount.toLocaleString()}
        subtitle="including spaces"
        icon={<FileText className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      
      <StatsCard
        title="Collaborators"
        value={stats.collaborators}
        subtitle="active now"
        icon={<Users className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-green-500 to-green-600"
      />
      
      <StatsCard
        title="Last Edited"
        value={stats.lastEdited}
        subtitle="auto-saved"
        icon={<Clock className="w-6 h-6 text-white" />}
        color="bg-gradient-to-br from-orange-500 to-orange-600"
      />
    </div>
  );
}
