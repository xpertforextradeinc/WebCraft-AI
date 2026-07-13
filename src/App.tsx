/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { templates } from './templates';
import { supabase, isSupabaseConfigured, getSupabaseProjectRef } from './utils/supabaseClient';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  Download, 
  Layers, 
  Layout, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  CreditCard, 
  ArrowRight, 
  Laptop, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw,
  LogIn,
  LogOut,
  User,
  Coins,
  Database,
  History,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [iframeSize, setIframeSize] = useState<'desktop' | 'mobile'>('desktop');
  
  // Advanced Multi-Model SaaS Architect States
  const [generationMode, setGenerationMode] = useState<'layout' | 'refine' | 'image' | 'video'>('layout');
  const [isProPlan, setIsProPlan] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; type: 'image' | 'video'; source: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'website' | 'media'>('website');

  // Supabase Auth and SaaS dynamic credit states
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ plan_tier: string; media_credits: number; table_missing?: boolean } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showHostingUpsell, setShowHostingUpsell] = useState(false);

  // Helper: Retrieve or generate a persistent local Guest ID for session-based credits tracking
  const getOrCreateGuestId = () => {
    let guestId = localStorage.getItem('webcraft_guest_id');
    if (!guestId) {
      guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem('webcraft_guest_id', guestId);
    }
    return guestId;
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('plan_tier, media_credits')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
          // Table doesn't exist yet, graceful staging fallback
          setProfile({ plan_tier: 'free', media_credits: 5, table_missing: true });
          setIsProPlan(false);
          return;
        }
        throw error;
      }

      if (!data) {
        // Create profile if missing
        const newProfile = { id: userId, email, plan_tier: 'free', media_credits: 5 };
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(newProfile);
        
        if (!insertError) {
          setProfile({ plan_tier: 'free', media_credits: 5 });
          setIsProPlan(false);
        } else {
          setProfile({ plan_tier: 'free', media_credits: 5 });
          setIsProPlan(false);
        }
      } else {
        setProfile(data as any);
        setIsProPlan(data.plan_tier === 'pro');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile({ plan_tier: 'free', media_credits: 5, table_missing: true });
    }
  };

  const fetchGenerations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (!error && data) {
        setRecentGenerations(data);
      }
    } catch (e) {
      console.warn("Could not load recent generations:", e);
    }
  };

  useEffect(() => {
    let profileSub: any = null;
    let authSub: any = null;

    const initAuthAndProfile = async () => {
      setAuthLoading(true);
      
      if (!isSupabaseConfigured) {
        console.log("Supabase is not configured. Falling back to Guest Local Storage sandbox.");
        const activeUserId = getOrCreateGuestId();
        setUser(null);
        setProfile({ plan_tier: 'free', media_credits: 5, table_missing: true });
        setIsProPlan(false);
        setAuthLoading(false);
        return;
      }

      try {
        // 1. Check current Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        let activeUser = session?.user || null;
        let activeUserId = activeUser?.id;

        // 2. If no authenticated user, attempt anonymous sign-in (creates a real Auth record)
        if (!activeUser) {
          try {
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (!anonError && anonData?.user) {
              activeUser = anonData.user;
              activeUserId = anonData.user.id;
            }
          } catch (e) {
            console.warn("Anonymous auth sign-in not configured or failed, falling back to local guest ID:", e);
          }
        }

        // 3. Fallback to localStorage guest ID if both auth mechanisms fail
        if (!activeUserId) {
          activeUserId = getOrCreateGuestId();
        }

        setUser(activeUser);

        // 4. Fetch profile details
        await fetchProfile(activeUserId, activeUser?.email || 'guest@example.com');

        // 5. Establish real-time listener subscription to profile changes
        profileSub = supabase
          .channel(`profile-${activeUserId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles',
              filter: `id=eq.${activeUserId}`,
            },
            (payload) => {
              const newProfile = payload.new as any;
              if (newProfile && typeof newProfile === 'object' && 'plan_tier' in newProfile) {
                setProfile(newProfile);
                setIsProPlan(newProfile.plan_tier === 'pro');
              }
            }
          )
          .subscribe();

        // 6. Fetch recent generations
        fetchGenerations(activeUserId);

      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuthAndProfile();

    // Listen to Auth state changes
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email || 'user@example.com');
          fetchGenerations(session.user.id);
        } else {
          setUser(null);
          const guestId = getOrCreateGuestId();
          await fetchProfile(guestId, 'guest@example.com');
          fetchGenerations(guestId);
        }
      });
      authSub = data.subscription;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'analytics_click') {
        console.log('Analytics Click Tracked:', event.data);
      }
    };
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (profileSub && isSupabaseConfigured) supabase.removeChannel(profileSub);
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert('Registration successful! Check your email or sign in.');
        setShowAuthModal(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    alert('Logged out successfully.');
  };

  const generateWebsite = async (isFollowUp = false, inputPrompt = '') => {
    const finalPrompt = inputPrompt || (isFollowUp ? followUpPrompt : prompt);
    if (!finalPrompt.trim()) return;

    const activeUserId = user?.id || localStorage.getItem('webcraft_guest_id') || '';
    const activeUserEmail = user?.email || 'guest@example.com';

    // SaaS billing/credits guards
    if (profile && !profile.table_missing) {
      const isFreeTier = profile.plan_tier !== 'pro';
      const isRefineOrMedia = ['refine', 'image', 'video'].includes(generationMode);

      if (isFreeTier && isRefineOrMedia && profile.media_credits <= 0) {
        alert("You have consumed all your free media/OpenAI refinement credits. Please upgrade to Pro with our secure Paystack checkout!");
        return;
      }
    } else {
      // Missing table / disconnected fallback guard
      if (!isProPlan && (generationMode !== 'layout' && !inputPrompt)) {
        alert(`AI ${generationMode === 'refine' ? 'OpenAI Refinement' : generationMode === 'image' ? 'Image Generation' : 'Video Hero Banner'} is a Pro Feature. Please activate the Pro Plan using our secure Paystack checkout!`);
        return;
      }
    }

    setLoading(true);

    try {
      if (generationMode === 'layout' || generationMode === 'refine' || inputPrompt) {
        const selectedModel = (generationMode === 'refine' && !inputPrompt) ? 'openai' : 'gemini';

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              prompt: finalPrompt, 
              existingCode: isFollowUp ? generatedCode : null,
              model: selectedModel,
              userId: activeUserId,
              email: activeUserEmail
          }),
        });
        
        if (response.status === 402) {
          throw new Error("Insufficient credits. Please upgrade or purchase more generations.");
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setGeneratedCode(data.code);
        setGeneratedMedia(null); 
        setActiveTab('website');
        setShowHostingUpsell(true);

        if (isFollowUp) {
            setFollowUpPrompt('');
        } else {
            if (inputPrompt) setPrompt(inputPrompt);
        }
      } else {
        // AI Media Assets Generation
        const response = await fetch('/api/generate-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              prompt: finalPrompt, 
              type: generationMode,
              userId: activeUserId,
              email: activeUserEmail
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Generation failed with status ${response.status}`);
        }

        const data = await response.json();
        
        setGeneratedMedia({
          url: data.url,
          type: data.type,
          source: data.source
        });
        setActiveTab('media');

        if (inputPrompt) setPrompt(inputPrompt);
      }

      // Refresh Generations History log dynamically
      if (activeUserId) {
        fetchGenerations(activeUserId);
      }

    } catch (error: any) {
      console.error('Error generating content:', error);
      alert(error.message || 'Generation encountered an issue. Re-routing or fallback details printed to dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    setShowHostingUpsell(true);
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = () => {
    // @ts-ignore
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_mock_public_key', 
      email: user?.email || 'user@example.com',
      amount: 100000, 
      plan: 'PLN_kh753o3e43u2fa3',
      onSuccess: async (transaction: any) => {
        setIsProPlan(true);
        // Persist the plan tier to Supabase user_profiles
        const activeUserId = user?.id || localStorage.getItem('webcraft_guest_id');
        if (activeUserId) {
          await supabase
            .from('user_profiles')
            .update({ plan_tier: 'pro' })
            .eq('id', activeUserId);
        }
        alert('Payment success! Plan: Pro Multi-Model Active has been enabled.');
      },
      onCancel: () => {
        alert('Subscription checkout cancelled.');
      },
    });
  };

  // Smart AI Code Injection
  const insertMediaIntoLayout = () => {
    if (!generatedMedia || !generatedCode) return;
    let updatedCode = generatedCode;

    if (generatedMedia.type === 'image') {
      const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/i;
      const match = updatedCode.match(imgRegex);
      if (match) {
        updatedCode = updatedCode.replace(match[1], generatedMedia.url);
        alert("Smart Inject: Placeholder image replaced with your AI generated layout asset!");
      } else {
        const insertHtml = `
<div class="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
  <img src="${generatedMedia.url}" alt="AI Generated Asset" class="w-full h-auto rounded-lg shadow-md max-h-[500px] object-cover" referrerPolicy="no-referrer" />
  <p class="text-xs text-gray-400 mt-3 font-mono">Dynamic AI Image Asset injected via WebCraft AI</p>
</div>`;
        if (updatedCode.includes('</body>')) {
          updatedCode = updatedCode.replace('</body>', `${insertHtml}\n</body>`);
        } else {
          updatedCode += insertHtml;
        }
        alert("Smart Inject: No initial placeholder img tags existed, so we successfully injected your custom media block at the bottom of the layout!");
      }
    } else if (generatedMedia.type === 'video') {
      const videoRegex = /<video[^>]*src=["']([^"']*)["'][^>]*>/i;
      const match = updatedCode.match(videoRegex);
      if (match) {
        updatedCode = updatedCode.replace(match[1], generatedMedia.url);
        alert("Smart Inject: Custom dynamic background loop injected into your video placeholder!");
      } else {
        const videoHeroHtml = `
<div class="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black text-white rounded-2xl my-6 mx-4 shadow-xl">
  <video autoplay loop muted playsinline class="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover opacity-60">
    <source src="${generatedMedia.url}" type="video/mp4" />
  </video>
  <div class="relative z-10 text-center px-4 max-w-3xl">
    <span class="px-3 py-1 bg-indigo-600/80 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">AI Motion Hero</span>
    <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight">Interactive Canvas Experience</h1>
    <p class="mt-3 text-lg text-gray-200">This breathtaking cinematic motion backdrop was generated and woven straight into your website code.</p>
  </div>
</div>`;
        if (updatedCode.includes('</body>')) {
          updatedCode = updatedCode.replace('<body>', `<body>\n${videoHeroHtml}`);
        } else {
          updatedCode = videoHeroHtml + updatedCode;
        }
        alert("Smart Inject: Dynamic Background Video Hero woven successfully into the top of your layout structure!");
      }
    }
    setGeneratedCode(updatedCode);
    setActiveTab('website');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* SaaS Main Header Area */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                WebCraft AI
              </h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise AI SaaS Page & Asset Builder</p>
            </div>
          </div>

          {/* Billing, Credits Balance & Dynamic Auth Control Panel */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Database Staging Mode warning when table is missing */}
            {profile?.table_missing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm" title="Setup user_profiles and generations tables in Supabase for full features">
                <ShieldAlert size={12} />
                Offline Mode (No Tables)
              </span>
            )}

            {/* Supabase Connection Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border shadow-sm ${
              isSupabaseConfigured 
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`} title={`Supabase Project Reference: ${getSupabaseProjectRef()}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              DB: {getSupabaseProjectRef()}
            </span>

            {/* Live Credits display */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 shadow-sm">
              <Coins size={14} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              Credits:{' '}
              {profile ? (
                profile.plan_tier === 'pro' ? (
                  <span className="text-indigo-600 font-black">Unlimited 🚀</span>
                ) : (
                  <span className="text-slate-900">{profile.media_credits} Left</span>
                )
              ) : (
                'Loading...'
              )}
            </span>

            {/* Plan Tier Status */}
            {isProPlan ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Plan: Pro Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                Plan: Free Staging
              </span>
            )}
            
            {!isProPlan && (
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <CreditCard size={14} />
                Upgrade (Paystack)
              </button>
            )}

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Auth Dropdown Hook */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse"></div>
            ) : user && !user.is_anonymous ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold hidden md:inline" title={user.email}>
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthEmail('');
                  setAuthPassword('');
                  setIsSignUp(false);
                  setAuthError('');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <LogIn size={14} />
                Sync Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Dynamic Warning Hook for Locked Models */}
        {['refine', 'image', 'video'].includes(generationMode) && !isProPlan && (!profile || profile.media_credits <= 0) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm animate-fade-in flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Premium Feature Locked / No Credits</h4>
                <p className="text-xs text-amber-700">OpenAI refinement, high-fidelity AI Image assets, and cinematic Video Hero Banners are available on our Pro Plan.</p>
              </div>
            </div>
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Unlock Pro Plan
            </button>
          </div>
        )}

        {/* Central Controls Platform Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Generation Mode Control */}
            <div className="flex flex-col gap-1.5 md:w-72">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generation Mode</label>
              <div className="relative">
                <select 
                  value={generationMode} 
                  onChange={(e) => setGenerationMode(e.target.value as any)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="layout">Generate Layout (Gemini) - Free</option>
                  <option value="refine">Refine Content (OpenAI) - 1 Credit</option>
                  <option value="image">AI Image Assets - 1 Credit</option>
                  <option value="video">AI Video Hero Banners - 1 Credit</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>

            {/* Main Prompt Field */}
            <div className="flex flex-col gap-1.5 flex-grow">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">What should we create?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    generationMode === 'layout' ? "Describe your complete website layout (e.g. A gorgeous SaaS dashboard)..." :
                    generationMode === 'refine' ? "Provide fine-tuning instructions for OpenAI..." :
                    generationMode === 'image' ? "Describe a specific image asset to generate (e.g. Modern illustration of team working)..." :
                    "Specify keywords for a breathtaking background video hero loop..."
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') generateWebsite();
                  }}
                  className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
                />
                
                <button
                  onClick={() => generateWebsite()}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 disabled:bg-indigo-300 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Board */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Instant Template Frameworks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  setGenerationMode('layout');
                  generateWebsite(false, template.prompt);
                }}
                className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md text-left transition-all duration-200 cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{template.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{template.prompt}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Sandbox Multi-Environment Staging Canvas */}
        {(generatedCode || generatedMedia) && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-8 animate-fade-in">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                {generatedCode && (
                  <button
                    onClick={() => setActiveTab('website')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                      activeTab === 'website'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 relative cursor-pointer ${
                      activeTab === 'media'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {generatedMedia.type === 'image' ? <ImageIcon size={14} /> : <VideoIcon size={14} />}
                    AI Media Staging
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  </button>
                )}
              </div>

              {/* Utility Toolbars */}
              {activeTab === 'website' && generatedCode && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIframeSize('desktop')} 
                    className={`p-2 rounded-lg transition cursor-pointer ${iframeSize === 'desktop' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Desktop Preview"
                  >
                    <Laptop size={16} />
                  </button>
                  <button 
                    onClick={() => setIframeSize('mobile')} 
                    className={`p-2 rounded-lg transition cursor-pointer ${iframeSize === 'mobile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Mobile View"
                  >
                    <Smartphone size={16} />
                  </button>
                  <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                  <button 
                    onClick={downloadCode} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Download size={12} />
                    Download HTML
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedCode).then(() => alert('Prinstine HTML Code copied!'))} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Copy size={12} />
                    Copy Code
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50">
              {activeTab === 'website' && generatedCode && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {/* Inline Staging Follow Up Prompt */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={followUpPrompt}
                      onChange={(e) => setFollowUpPrompt(e.target.value)}
                      placeholder="Instruct WebCraft AI on design refitting, sections, or styling details..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') generateWebsite(true);
                      }}
                      className="flex-grow p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button
                      onClick={() => generateWebsite(true)}
                      disabled={loading}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-50 disabled:bg-emerald-300 flex items-center gap-2 cursor-pointer"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                      Update Code
                    </button>
                  </div>
                  
                  {/* Staged HTML Renderer IFrame */}
                  <div className="bg-white rounded-xl shadow-inner border border-slate-200 p-2">
                    <iframe
                      srcDoc={generatedCode}
                      title="WebCraft AI Staging Preview"
                      className={`w-full h-[600px] border-0 rounded-lg bg-white transition-all duration-300 ${
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
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        {generatedMedia.type === 'image' ? (
                          <ImageIcon size={18} className="text-indigo-600" />
                        ) : (
                          <VideoIcon size={18} className="text-purple-600 animate-pulse" />
                        )}
                        Staged AI {generatedMedia.type === 'image' ? 'Image Asset' : 'Motion Hero'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        Source Engine: <span className="text-slate-600 font-mono font-extrabold">{generatedMedia.source}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {generatedCode && (
                        <button
                          onClick={insertMediaIntoLayout}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition shadow-sm cursor-pointer"
                        >
                          <Layers size={13} />
                          Insert into Layout
                        </button>
                      )}
                      <a
                        href={generatedMedia.url}
                        download={`webcraft-ai-${generatedMedia.type}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition shadow-sm cursor-pointer"
                      >
                        <Download size={13} />
                        Download Asset
                      </a>
                    </div>
                  </div>

                  {/* Rendering Content Box */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-950 flex items-center justify-center min-h-[350px] shadow-inner">
                    {generatedMedia.type === 'image' ? (
                      <img
                        src={generatedMedia.url}
                        alt="AI Generation results"
                        className="max-w-full max-h-[450px] object-contain rounded-lg"
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
                        className="w-full max-h-[450px] object-contain rounded-lg"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-Time Database Generations History Feed */}
        {recentGenerations.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={16} className="text-indigo-600" />
              Dynamic Generations History
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                      {gen.type === 'layout' || gen.type === 'refine' ? <Layout size={10} /> : gen.type === 'image' ? <ImageIcon size={10} /> : <VideoIcon size={10} />}
                      {gen.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(gen.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 italic mb-3 font-medium">
                    "{gen.prompt}"
                  </p>
                  
                  <div className="flex justify-end gap-1.5">
                    {gen.type === 'layout' || gen.type === 'refine' ? (
                      <button
                        onClick={() => {
                          setGeneratedCode(gen.output_content);
                          setGeneratedMedia(null);
                          setActiveTab('website');
                          alert("History restored: Loaded website layout!");
                        }}
                        className="text-[10px] font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition"
                      >
                        Load Website
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setGeneratedMedia({
                            url: gen.output_content,
                            type: gen.type as 'image' | 'video',
                            source: 'Supabase History'
                          });
                          setActiveTab('media');
                          alert(`History restored: Loaded AI ${gen.type}!`);
                        }}
                        className="text-[10px] font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition"
                      >
                        Load Media
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sync Profile Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <UserCheck className="text-indigo-600" size={20} />
              {isSignUp ? 'Create SaaS Account' : 'Sync Existing Profile'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Log in to sync your active generations, plan subscription levels, and dynamic credit balances instantly.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl leading-relaxed">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="name@example.com"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-50 transition cursor-pointer mt-2"
              >
                {isSignUp ? 'Register Account' : 'Sign In and Sync'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 font-bold hover:underline"
              >
                {isSignUp ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Hosting & Domain Upsell Panel Modal Overlay */}
      {showHostingUpsell && (
        <div id="hosting-upsell-modal" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                🚀
              </div>
              
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Ready to Launch WebCraft AI Live?
              </h3>
              
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Your custom AI website workspace layout has generated successfully. To take this project live immediately with a premium dedicated hosting server and an officially registered custom domain node (.com, .org, .ng, etc.), tap below to spin up your instance.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  id="request-hosting-btn"
                  href={`https://t.me?text=${encodeURIComponent(`Hello Hassan, I would like to request hosting and domain setup for my WebCraft AI website layout. User email: ${user?.email || 'guest@example.com'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  💬 Request Hosting & Domain Setup
                </a>

                <button
                  id="cancel-hosting-btn"
                  onClick={() => setShowHostingUpsell(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Keep Editing in Sandbox
                </button>
              </div>

              <p className="mt-4 text-[10px] text-slate-400 italic">
                *Clicking this will automatically draft your deployment request directly into your chat window with Hassan.*
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
