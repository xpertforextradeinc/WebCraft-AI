import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  Layout, 
  Smartphone, 
  Laptop, 
  Send, 
  RefreshCw, 
  Check, 
  Copy, 
  Plus, 
  ArrowLeft,
  Key,
  Database,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';

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
  prompt = '',
  setPrompt,
  followUpPrompt = '',
  setFollowUpPrompt,
  generatedCode = '',
  setGeneratedCode,
  loading = false,
  iframeSize = 'desktop',
  setIframeSize,
  generationMode = 'layout',
  setGenerationMode,
  isProPlan = false,
  generateWebsite,
  downloadCode,
  handlePublishClick,
  includeAuth = false,
  setIncludeAuth,
  isGenerating = false,
}) => {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [localFollowUp, setLocalFollowUp] = useState(followUpPrompt);
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD' | 'GHS'>('NGN');
  const [copySuccess, setCopySuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followUpRef = useRef<HTMLTextAreaElement>(null);

  const actualIsGenerating = isGenerating || loading;

  // Auto-resize textarea for main prompt
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [localPrompt]);

  // Auto-resize textarea for follow up
  useEffect(() => {
    if (followUpRef.current) {
      followUpRef.current.style.height = 'auto';
      followUpRef.current.style.height = `${Math.min(followUpRef.current.scrollHeight, 120)}px`;
    }
  }, [localFollowUp]);

  const handleGenerateClick = async () => {
    if (!localPrompt.trim() || actualIsGenerating) return;

    // Apply currency instruction to ensure AI formats prices correctly
    let finalPrompt = localPrompt.trim();
    if (selectedCurrency !== 'NGN') {
      finalPrompt += ` (Please format all prices, billing packages, and currency symbols on the website explicitly in ${selectedCurrency})`;
    } else {
      finalPrompt += ` (Please format all prices, billing packages, and currency symbols on the website explicitly in NGN / ₦)`;
    }

    setPrompt?.(localPrompt);
    if (generateWebsite) {
      await generateWebsite(false, finalPrompt);
    }
  };

  const handleRefineClick = async () => {
    if (!localFollowUp.trim() || actualIsGenerating) return;

    setFollowUpPrompt?.(localFollowUp);
    if (generateWebsite) {
      await generateWebsite(true, localFollowUp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  const handleFollowUpKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRefineClick();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const hasCode = generatedCode && generatedCode.trim() !== '';

  if (!hasCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] bg-[#0a0b0f] text-white font-sans px-4">
        <div className="max-w-2xl w-full flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              What website should we build today?
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Describe your business, conversion goals, and details.
            </p>
          </div>

          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 shadow-2xl transition-all duration-200 focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
            <textarea
              ref={textareaRef}
              rows={3}
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., A modern high-converting landing page for a boutique Lagos coworking space with pricing grids, Lagos maps, and direct WhatsApp booking hooks..."
              className="w-full bg-transparent border-none text-white placeholder-slate-500 text-sm focus:outline-none resize-none leading-relaxed"
              disabled={actualIsGenerating}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 mt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-bold tracking-wide uppercase">Currency:</span>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {(['NGN', 'USD', 'GHS'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedCurrency === curr 
                          ? 'bg-[#7c3aed] text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                      disabled={actualIsGenerating}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {localPrompt.length} chars
                </span>
                <button
                  onClick={handleGenerateClick}
                  disabled={!localPrompt.trim() || actualIsGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {actualIsGenerating ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Assembling...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Website
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-[10px] text-slate-600 font-mono">
              Press <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded">Cmd + Enter</kbd> to launch builder routines.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[78vh] bg-[#0a0b0f] rounded-2xl border border-slate-800/80 overflow-hidden text-white font-sans shadow-2xl relative">
      {/* Dynamic Iframe Workspace Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGeneratedCode?.('')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-800"
            title="Return to the prompt screen to generate a completely new website layout"
          >
            <ArrowLeft size={13} />
            New Website
          </button>
          
          <div className="h-4 w-[1px] bg-slate-800"></div>

          {/* Iframe View Size Controller */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setIframeSize?.('desktop')}
              className={`p-1.5 rounded-md transition-all ${
                iframeSize === 'desktop' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop Preview Mode"
            >
              <Laptop size={14} />
            </button>
            <button
              onClick={() => setIframeSize?.('mobile')}
              className={`p-1.5 rounded-md transition-all ${
                iframeSize === 'mobile' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Responsive Preview Mode"
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>

        {/* Deployment and Copy Utilities */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Working Auth Toggle */}
          <button
            onClick={() => setIncludeAuth?.(!includeAuth)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              includeAuth 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Enable user registration/login forms backed by live Supabase system"
          >
            <Key size={13} />
            Auth Starter Kit: {includeAuth ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-800"
          >
            {copySuccess ? (
              <>
                <Check size={13} className="text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy HTML
              </>
            )}
          </button>

          {downloadCode && (
            <button
              onClick={downloadCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0f] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-800"
            >
              <Download size={13} />
              ZIP Export
            </button>
          )}

          {handlePublishClick && (
            <button
              onClick={handlePublishClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Database size={13} />
              Publish Live
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 bg-slate-950 flex justify-center items-center overflow-hidden relative">
        {actualIsGenerating && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <RefreshCw className="animate-spin text-[#7c3aed]" size={32} />
              <div>
                <p className="text-sm font-bold text-white">Assembling production modules...</p>
                <p className="text-xs text-slate-500 mt-1">Re-weaving CSS patterns and dynamic conversion channels live.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className={`h-full transition-all duration-300 bg-white shadow-2xl relative ${
          iframeSize === 'mobile' ? 'w-[375px] max-w-full my-4 rounded-xl border-8 border-slate-800 overflow-hidden' : 'w-full'
        }`}>
          <iframe
            srcDoc={generatedCode}
            title="WebCraft Live Run View"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
        </div>
      </div>

      {/* Sleek Refinement Dashboard Panel */}
      <div className="bg-slate-950 border-t border-slate-800 p-3">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Mode selector tab */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800/80 flex-shrink-0">
            <button
              onClick={() => setGenerationMode?.('refine')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                generationMode === 'refine' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={11} />
              Refine content
            </button>
            <button
              onClick={() => setGenerationMode?.('image')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                generationMode === 'image' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon size={11} />
              AI Image
            </button>
            <button
              onClick={() => setGenerationMode?.('video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                generationMode === 'video' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <VideoIcon size={11} />
              AI Video Banner
            </button>
          </div>

          {/* Prompt Refinement Box */}
          <div className="flex-1 flex gap-2 items-center bg-[#0a0b0f] border border-slate-800/80 rounded-xl px-3 py-1.5 focus-within:border-[#7c3aed]">
            <textarea
              ref={followUpRef}
              rows={1}
              value={localFollowUp}
              onChange={(e) => setLocalFollowUp(e.target.value)}
              onKeyDown={handleFollowUpKeyDown}
              placeholder={
                generationMode === 'refine' 
                  ? "Describe what to refine or change (e.g. Change primary button to hot pink)..."
                  : generationMode === 'image'
                  ? "Describe the AI image asset you want to generate (e.g. professional Lagos office lobby)..."
                  : "Describe the cinematic motion video hero prompt (e.g. abstract digital networks flowing slow)..."
              }
              className="flex-1 bg-transparent border-none text-white placeholder-slate-500 text-xs focus:outline-none resize-none leading-relaxed self-center max-h-16 py-0.5"
              disabled={actualIsGenerating}
            />
            <button
              onClick={handleRefineClick}
              disabled={!localFollowUp.trim() || actualIsGenerating}
              className="px-3.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer self-center"
            >
              <Send size={11} />
              Refine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderView;
