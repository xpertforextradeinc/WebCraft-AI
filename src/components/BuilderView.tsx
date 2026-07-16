import React from 'react';
import { 
  Sparkles, 
  Lock, 
  RefreshCw, 
  Layout, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Laptop, 
  Smartphone, 
  Send, 
  Download, 
  Copy, 
  Check, 
  Layers,
  ArrowLeft,
  X,
  MessageSquare,
  Wand2,
  Globe
} from 'lucide-react';
import { GeneratedMedia, UserProfile } from '../types';

export const modeOptions = [
  { 
    id: 'layout' as const, 
    label: 'Generate Layout', 
    desc: 'Gemini AI - Free', 
    icon: Layout, 
    details: 'Complete section structures, copy & layout framework',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
    accentColor: 'from-violet-600 to-indigo-600'
  },
  { 
    id: 'refine' as const, 
    label: 'Refine Content', 
    desc: 'OpenAI - 1 Credit', 
    icon: Sparkles, 
    details: 'Fine-tune sections, customize blocks, and polish copy',
    color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100',
    accentColor: 'from-fuchsia-600 to-pink-600'
  },
  { 
    id: 'image' as const, 
    label: 'AI Image Assets', 
    desc: 'Dynamic Graphics - 1 Credit', 
    icon: ImageIcon, 
    details: 'Create custom premium vectors, banners, and logos',
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    accentColor: 'from-sky-600 to-blue-600'
  },
  { 
    id: 'video' as const, 
    label: 'AI Video Hero Banners', 
    desc: 'Motion Loop - 1 Credit', 
    icon: VideoIcon, 
    details: 'Embed immersive, cinematic motion background loops',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    accentColor: 'from-amber-600 to-orange-600'
  }
];

interface BuilderViewProps {
  prompt: string;
  setPrompt: (val: string) => void;
  followUpPrompt: string;
  setFollowUpPrompt: (val: string) => void;
  generatedCode: string;
  setGeneratedCode: (val: string) => void;
  loading: boolean;
  iframeSize: 'desktop' | 'mobile';
  setIframeSize: (val: 'desktop' | 'mobile') => void;
  generationMode: 'layout' | 'refine' | 'image' | 'video';
  setGenerationMode: (val: 'layout' | 'refine' | 'image' | 'video') => void;
  isProPlan: boolean;
  generatedMedia: GeneratedMedia | null;
  setGeneratedMedia: (val: GeneratedMedia | null) => void;
  activeTab: 'website' | 'media';
  setActiveTab: (val: 'website' | 'media') => void;
  dropdownOpen: boolean;
  setDropdownOpen: (val: boolean) => void;
  generateWebsite: (isFollowUp?: boolean, inputPrompt?: string) => Promise<void>;
  downloadCode: () => void;
  handlePublishClick: () => Promise<void>;
  insertMediaIntoLayout: () => void;
  profile: UserProfile | null;
  setShowPaymentModal: (val: boolean) => void;
  includeAuth: boolean;
  setIncludeAuth: (val: boolean) => void;
}

export default function BuilderView({
  prompt,
  setPrompt,
  followUpPrompt,
  setFollowUpPrompt,
  generatedCode,
  setGeneratedCode,
  loading,
  iframeSize,
  setIframeSize,
  generationMode,
  setGenerationMode,
  isProPlan,
  generatedMedia,
  setGeneratedMedia,
  activeTab,
  setActiveTab,
  dropdownOpen,
  setDropdownOpen,
  generateWebsite,
  downloadCode,
  handlePublishClick,
  insertMediaIntoLayout,
  profile,
  setShowPaymentModal,
  includeAuth,
  setIncludeAuth,
}: BuilderViewProps) {

  const isGeneratingActive = generatedCode || generatedMedia;

  const handleResetCanvas = () => {
    if (confirm("Reset current workspace? This will clear active layouts from builder cache.")) {
      setGeneratedCode('');
      setGeneratedMedia(null);
      setPrompt('');
      setFollowUpPrompt('');
    }
  };

  return (
    <div className="animate-fade-in w-full">
      {/* 1. BLANK STATE / HERO INPUT SCREEN */}
      {!isGeneratingActive ? (
        <div className="max-w-3xl mx-auto py-8 md:py-12">
          {/* Tagline section prominently centered, minimal distraction */}
          <div className="text-center pb-6 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3.5 rounded-full bg-violet-50 border border-violet-100/60 shadow-xs">
              <Sparkles className="text-violet-600 animate-pulse" size={12} />
              <span className="text-[10px] text-violet-700 font-extrabold uppercase tracking-widest">
                Multi-Model Autopilot v2.0
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight leading-none mb-3.5">
              Describe your idea. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                Watch it build itself.
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed mb-6">
              Instantly transform plain-language ideas into a fully responsive, working website in seconds — no coding or technical skills required. Tailored specifically for Nigerian businesses looking for a fast, beautiful, and affordable digital presence.
            </p>

            {/* Compact 3-Step "How it Works" Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-4">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                  <MessageSquare size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-800 leading-none">1. Describe</p>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Type your business idea</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Wand2 size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-800 leading-none">2. Generate</p>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Watch code build live</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Globe size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-800 leading-none">3. Publish</p>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Go live in one click</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium features billing warning banner */}
          {['refine', 'image', 'video'].includes(generationMode) && !isProPlan && (!profile || profile.media_credits <= 0) && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm animate-fade-in flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Lock size={15} />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-900 text-xs">Premium Feature Locked / No Credits</h4>
                  <p className="text-[10px] text-amber-700">OpenAI refinement and AI assets require Pro tier access.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
              >
                Unlock Pro Plan
              </button>
            </div>
          )}

          {/* Prompt Generator Board */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col gap-5">
              
              {/* Generation Mode Control */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generation Mode</label>
                
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-left shadow-xs cursor-pointer z-20 relative"
                >
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const currentMode = modeOptions.find(o => o.id === generationMode) || modeOptions[0];
                      const IconComp = currentMode.icon;
                      return (
                        <>
                          <div className={`p-1.5 rounded-lg ${currentMode.color} border shadow-xs`}>
                            <IconComp size={15} />
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 text-xs sm:text-sm">{currentMode.label}</span>
                            <span className="block text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">{currentMode.desc}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="fixed inset-0 z-10 cursor-default" onClick={() => setDropdownOpen(false)} />
                )}

                <div 
                  className={`absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1.5 transition-all duration-200 origin-top ${
                    dropdownOpen 
                      ? 'opacity-100 translate-y-0 scale-100 visible' 
                      : 'opacity-0 -translate-y-2 scale-95 invisible pointer-events-none'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {modeOptions.map((opt) => {
                      const IconComp = opt.icon;
                      const isSelected = generationMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setGenerationMode(opt.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left cursor-pointer ${
                            isSelected 
                              ? 'bg-violet-50/70 text-violet-950 border border-violet-100/60 shadow-xs' 
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-all ${isSelected ? opt.color : 'text-slate-500 bg-slate-100'}`}>
                            <IconComp size={15} />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900">{opt.label}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-0.5 rounded-md font-bold shadow-xs">
                                  Selected
                                </span>
                              )}
                            </div>
                            <span className="block text-[9px] text-slate-400 font-bold leading-normal mt-0.5">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Main Prompt Input Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What should we create?</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      generationMode === 'layout' ? "Describe your complete website layout (e.g. A gorgeous SaaS dashboard)..." :
                      generationMode === 'refine' ? "Provide fine-tuning instructions for OpenAI..." :
                      generationMode === 'image' ? "Describe a specific image asset to generate (e.g. Modern vector illustrations)..." :
                      "Specify keywords for a breathtaking background video hero loop..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') generateWebsite();
                    }}
                    className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400 font-medium"
                  />
                  
                  <button
                    onClick={() => generateWebsite()}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-violet-100 hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate Now
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 font-medium pl-1 flex items-center gap-1.5 mt-1 animate-fade-in">
                  <span className="text-amber-500 font-black">Tip:</span> Be specific — mention your business type, must-have sections, and the style you want (e.g. clean, modern, professional).
                </p>

                {generationMode === 'layout' && (
                  <div className="flex items-center gap-2 mt-3 px-1.5 animate-fade-in bg-slate-50/85 border border-slate-100 p-2 rounded-xl opacity-65 cursor-not-allowed">
                    <input
                      id="include-auth-toggle"
                      type="checkbox"
                      checked={false}
                      disabled
                      className="w-4 h-4 text-slate-400 border-slate-300 rounded focus:ring-0 cursor-not-allowed"
                    />
                    <label htmlFor="include-auth-toggle" className="text-xs font-bold text-slate-400 cursor-not-allowed select-none">
                      Include user accounts (Auth Starter Kit)
                    </label>
                    <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider scale-95 origin-left">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE GENERATIVE INTERACTIVE CANVAS & WORKSPACE */
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-12 animate-fade-in">
          {/* Iframe Control Utility Toolbar Bar */}
          <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            
            {/* View Tab Selection Controls */}
            <div className="flex gap-2">
              {generatedCode && (
                <button
                  onClick={() => setActiveTab('website')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    activeTab === 'website'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layout size={14} />
                  Live Website Canvas
                </button>
              )}
              {generatedMedia && (
                <button
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 relative cursor-pointer ${
                    activeTab === 'media'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {generatedMedia.type === 'image' ? <ImageIcon size={14} /> : <VideoIcon size={14} />}
                  AI Media Staging
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                </button>
              )}
            </div>

            {/* Canvas Action Operations Toolbars */}
            <div className="flex items-center gap-2">
              {activeTab === 'website' && generatedCode && (
                <>
                  <button 
                    onClick={() => setIframeSize('desktop')} 
                    className={`p-2 rounded-lg transition cursor-pointer ${iframeSize === 'desktop' ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'text-slate-400 hover:bg-slate-100 border border-transparent'}`}
                    title="Desktop Preview"
                  >
                    <Laptop size={14} />
                  </button>
                  <button 
                    onClick={() => setIframeSize('mobile')} 
                    className={`p-2 rounded-lg transition cursor-pointer ${iframeSize === 'mobile' ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'text-slate-400 hover:bg-slate-100 border border-transparent'}`}
                    title="Mobile View"
                  >
                    <Smartphone size={14} />
                  </button>
                  <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                  
                  <button 
                    onClick={handlePublishClick} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Send size={11} />
                    Publish
                  </button>
                  <button 
                    onClick={downloadCode} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Download size={11} />
                    Download HTML
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedCode).then(() => alert('HTML Copied successfully.'))} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer hidden sm:flex"
                  >
                    <Copy size={11} />
                    Copy Code
                  </button>
                </>
              )}

              <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
              {/* Reset Canvas Control to return to Blank/Starting layout page */}
              <button
                onClick={handleResetCanvas}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                title="Reset workspace back to original generator prompt page"
              >
                <ArrowLeft size={11} />
                New Layout
              </button>
            </div>

          </div>

          {/* Staged Canvas Renderer Frame Content panel area */}
          <div className="p-4 sm:p-6 bg-slate-50">
            {activeTab === 'website' && generatedCode && (
              <div className="flex flex-col gap-4 animate-fade-in">
                
                {/* Embedded Live Updates Prompt Input Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    placeholder="Instruct WebCraft AI on design adjustments, section refinements, or copywriting adjustments..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') generateWebsite(true);
                    }}
                    className="flex-grow p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm font-medium"
                  />
                  <button
                    onClick={() => generateWebsite(true)}
                    disabled={loading}
                    className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md disabled:from-violet-300 disabled:to-indigo-300 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                    Update Layout
                  </button>
                </div>
                
                {/* HTML Output IFrame Stage */}
                <div className="bg-white rounded-2xl shadow-inner border border-slate-250 p-2">
                  <iframe
                    srcDoc={generatedCode}
                    title="WebCraft AI Staging Preview"
                    className={`w-full h-[580px] border-0 rounded-xl bg-white transition-all duration-300 ${
                      iframeSize === 'mobile' ? 'max-w-[375px] mx-auto shadow-lg' : 'max-w-full'
                    }`}
                  />
                </div>
              </div>
            )}

            {activeTab === 'media' && generatedMedia && (
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      {generatedMedia.type === 'image' ? (
                        <ImageIcon size={16} className="text-violet-600" />
                      ) : (
                        <VideoIcon size={16} className="text-purple-600 animate-pulse" />
                      )}
                      Staged AI {generatedMedia.type === 'image' ? 'Image Asset' : 'Motion Hero'}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      Source Engine: <span className="text-slate-600 font-mono font-extrabold">{generatedMedia.source}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {generatedCode && (
                      <button
                        onClick={insertMediaIntoLayout}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black transition shadow-sm cursor-pointer"
                      >
                        <Layers size={11} />
                        Insert into Layout
                      </button>
                    )}
                    <a
                      href={generatedMedia.url}
                      download={`webcraft-ai-${generatedMedia.type}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition shadow-sm cursor-pointer"
                    >
                      <Download size={11} />
                      Download Asset
                    </a>
                  </div>
                </div>

                {/* Staging Assets Visual Render */}
                <div className="relative rounded-xl overflow-hidden border border-slate-150 bg-slate-950 flex items-center justify-center min-h-[320px] shadow-inner">
                  {generatedMedia.type === 'image' ? (
                    <img
                      src={generatedMedia.url}
                      alt="AI Media assets render output"
                      className="max-w-full max-h-[420px] object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <video
                      src={generatedMedia.url}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full max-h-[420px] object-contain rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
