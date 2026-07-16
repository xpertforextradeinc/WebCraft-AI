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
      </div>

      {/* Live Preview Workspace */}
      <div className="flex flex-1 overflow-hidden">
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
      </div>
    </div>
  );
};

export default BuilderView;
