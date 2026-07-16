import React, { useState } from 'react';
import { Search, Sparkles, Palette } from 'lucide-react';
import { templates } from '../templates';

interface TemplatesViewProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function TemplatesView({ onSelectTemplate }: TemplatesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto py-4">
      {/* Templates Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Palette className="text-violet-600" size={20} />
            Instant Template Frameworks
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose from premium skeleton setups to bootstrap your custom landing pages instantly.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search templates (e.g. crypto, restaurant, photography)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium shadow-xs"
          />
        </div>
      </div>

      {/* Grid Display */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.name}
              onClick={() => onSelectTemplate(template.prompt)}
              className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 text-left transition-all duration-300 cursor-pointer group shadow-sm flex flex-col justify-between h-36"
            >
              <div>
                <div className="text-xs font-black text-slate-950 mb-1.5 group-hover:text-violet-600 transition-colors">
                  {template.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed font-medium">
                  {template.prompt}
                </div>
              </div>
              <div className="text-[9px] text-violet-600 font-black tracking-wider uppercase mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={10} className="animate-pulse" />
                Select & Generate
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-500 font-bold">No templates found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs text-violet-600 font-bold hover:underline cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
}
