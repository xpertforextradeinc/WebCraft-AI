import React, { useState } from 'react';
import { History, Layout, Image as ImageIcon, Video as VideoIcon, ArrowRight, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { GenerationRecord } from '../types';

interface HistoryViewProps {
  recentGenerations: GenerationRecord[];
  onLoadWebsite: (code: string) => void;
  onLoadMedia: (url: string, type: 'image' | 'video') => void;
  isLoading?: boolean;
}

export default function HistoryView({
  recentGenerations,
  onLoadWebsite,
  onLoadMedia,
  isLoading = false,
}: HistoryViewProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredHistory = recentGenerations.filter(gen => {
    if (filterType === 'all') return true;
    return gen.type === filterType;
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto py-4">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-violet-600" size={20} />
            Generations Log History
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse and restore previous layouts, refinement runs, or dynamic asset generations.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['all', 'layout', 'refine', 'image', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                filterType === type
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Tabular list view */}
      {filteredHistory.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-6">Created On</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Prompt</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                {filteredHistory.map((gen) => {
                  const isCode = gen.type === 'layout' || gen.type === 'refine';
                  return (
                    <tr
                      key={gen.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Created On */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-400 text-[10px] font-semibold">
                        {new Date(gen.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <span className="block text-[9px] text-slate-300 font-medium mt-0.5">
                          {new Date(gen.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {gen.type === 'layout' || gen.type === 'refine' ? (
                            <Layout size={11} className="text-violet-600" />
                          ) : gen.type === 'image' ? (
                            <ImageIcon size={11} className="text-sky-600" />
                          ) : (
                            <VideoIcon size={11} className="text-purple-600" />
                          )}
                          {gen.type}
                        </span>
                      </td>

                      {/* Prompt Details */}
                      <td className="py-4 px-6 max-w-md">
                        <div className="line-clamp-2 text-slate-600 text-xs italic font-medium leading-relaxed">
                          "{gen.prompt}"
                        </div>
                      </td>

                      {/* Action trigger */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {isCode ? (
                          <button
                            onClick={() => onLoadWebsite(gen.output_content)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 hover:border-violet-200 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                          >
                            Load Canvas
                            <ArrowRight size={10} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onLoadMedia(gen.output_content, gen.type as 'image' | 'video')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                          >
                            Restore Asset
                            <ExternalLink size={10} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <History className="mx-auto text-slate-300 mb-3" size={32} />
          <p className="text-sm text-slate-500 font-bold">No generation records found</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Generations you run will automatically be catalogued here.
          </p>
        </div>
      )}
    </div>
  );
}
