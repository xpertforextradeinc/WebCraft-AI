import React, { useState } from 'react';

export interface BuilderViewProps {
  prompt?: string;
  setPrompt?: (val: string) => void;
  followUpPrompt?: string;
  setFollowUpPrompt?: (val: string) => void;
  generatedCode: string;
  setGeneratedCode?: (val: string) => void;
  loading?: boolean;
  iframeSize?: 'desktop' | 'mobile';
  setIframeSize?: (val: 'desktop' | 'mobile') => void;
  generationMode?: 'layout' | 'refine' | 'image' | 'video';
  setGenerationMode?: (val: 'layout' | 'refine' | 'image' | 'video') => void;
  isProPlan?: boolean;
  generatedMedia?: any;
  setGeneratedMedia?: (val: any) => void;
  activeTab?: 'website' | 'media';
  setActiveTab?: (val: 'website' | 'media') => void;
  dropdownOpen?: boolean;
  setDropdownOpen?: (val: boolean) => void;
  generateWebsite?: (isFollowUp?: boolean, inputPrompt?: string) => Promise<void>;
  downloadCode?: () => void;
  handlePublishClick?: () => Promise<void>;
  insertMediaIntoLayout?: () => void;
  profile?: any;
  setShowPaymentModal?: (val: boolean) => void;
  includeAuth?: boolean;
  setIncludeAuth?: (val: boolean) => void;

  isGenerating?: boolean;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ 
  generatedCode, 
  isGenerating = false,
  loading = false
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD' | 'GHS'>('NGN');
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');

  const actualIsGenerating = isGenerating || loading;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      {/* Control Navigation Strip */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-wide text-indigo-400">WebCraft-AI Workspace</h2>
          
          {/* Feature 1: Multi-Currency Pipeline Customizer */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            {(['NGN', 'USD', 'GHS'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedCurrency === curr ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* View Layout Toggles */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          {(['split', 'preview', 'code'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs capitalize rounded-md transition-all ${
                viewMode === mode ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Feature 2: Split-Screen View Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Compiled Raw Source Window */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className="flex-1 h-full border-r border-slate-800 bg-slate-950 overflow-auto p-4 font-mono text-sm text-emerald-400 selection:bg-slate-800">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-xs text-slate-500">
              <span>COMPILED OUTPUT (TARGET: {selectedCurrency})</span>
              <button 
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all"
              >
                Copy Code
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{generatedCode || '// Your AI generated codebase will compile here live...'}</pre>
          </div>
        )}

        {/* Right Side: Live Iframe Shell */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex-1 h-full bg-slate-900 relative">
            {actualIsGenerating && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between p-12 z-50">
                <div className="flex flex-col gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                  <p className="text-sm font-medium text-slate-300">Assembling production modules...</p>
                </div>
              </div>
            )}
            <iframe
              srcDoc={generatedCode}
              title="WebCraft Live Run View"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderView;
