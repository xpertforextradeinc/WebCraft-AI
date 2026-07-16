/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { templates } from './templates';
import { supabase, isSupabaseConfigured, getSupabaseProjectRef } from './utils/supabaseClient';
import Navigation from './components/Navigation';
import BuilderView from './components/BuilderView';
import TemplatesView from './components/TemplatesView';
import HistoryView from './components/HistoryView';
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
  UserCheck,
  Send
} from 'lucide-react';

const modeOptions = [
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

export default function App() {
  const [activeView, setActiveView] = useState<'builder' | 'templates' | 'history'>('builder');
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
  const [includeAuth, setIncludeAuth] = useState(false);
  
  // Custom dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Unified Payment & Subscription modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFlwPlan, setSelectedFlwPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [flwPlans, setFlwPlans] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('webcraft_flw_plans');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingFlwPlans, setLoadingFlwPlans] = useState(false);
  const [flwPlansError, setFlwPlansError] = useState<string | null>(null);

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
    let isMounted = true;
    let profileSub: any = null;
    let authSub: any = null;

    const initAuthAndProfile = async () => {
      setAuthLoading(true);
      
      if (!isSupabaseConfigured) {
        console.log("Supabase is not configured. Falling back to Guest Local Storage sandbox.");
        const activeUserId = getOrCreateGuestId();
        if (!isMounted) return;
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

        if (!isMounted) return;
        setUser(activeUser);

        // 4. Fetch profile details
        await fetchProfile(activeUserId, activeUser?.email || 'guest@example.com');

        if (!isMounted) return;

        // 5. Establish real-time listener subscription to profile changes with unique channel name
        const uniqueChannelId = `profile-${activeUserId}-${Math.random().toString(36).substring(2, 11)}`;
        const channelInstance = supabase.channel(uniqueChannelId);
        profileSub = channelInstance;

        channelInstance
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles',
              filter: `id=eq.${activeUserId}`,
            },
            (payload) => {
              if (!isMounted) return;
              const newProfile = payload.new as any;
              if (newProfile && typeof newProfile === 'object' && 'plan_tier' in newProfile) {
                setProfile(newProfile);
                setIsProPlan(newProfile.plan_tier === 'pro');
              }
            }
          )
          .subscribe((status: string) => {
            if (!isMounted && profileSub) {
              supabase.removeChannel(profileSub);
            }
          });

        // 6. Fetch recent generations
        fetchGenerations(activeUserId);

      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuthAndProfile();

    // Listen to Auth state changes
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email || 'user@example.com');
          if (!isMounted) return;
          fetchGenerations(session.user.id);
        } else {
          setUser(null);
          const guestId = getOrCreateGuestId();
          await fetchProfile(guestId, 'guest@example.com');
          if (!isMounted) return;
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
      isMounted = false;
      window.removeEventListener('message', handleMessage);
      if (profileSub && isSupabaseConfigured) {
        supabase.removeChannel(profileSub);
      }
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  const syncFlwPlans = async (force = false) => {
    if (!force && flwPlans.length > 0 && !flwPlansError) return; // Skip if already cached/loaded unless forced and no error

    setLoadingFlwPlans(true);
    setFlwPlansError(null);
    try {
      const res = await fetch('/api/flutterwave/create-plans');
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`HTTP error ${res.status}: Failed to parse JSON response`);
      }

      if (res.ok && data.success && data.plans) {
        setFlwPlans(data.plans);
        localStorage.setItem('webcraft_flw_plans', JSON.stringify(data.plans));
      } else {
        throw new Error(data.error || `HTTP error ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.error("Error fetching or establishing Flutterwave plans:", err);
      setFlwPlansError(err.message || "Payments temporarily unavailable.");
      setFlwPlans([]);
      localStorage.removeItem('webcraft_flw_plans');
    } finally {
      setLoadingFlwPlans(false);
    }
  };

  useEffect(() => {
    if (showPaymentModal) {
      syncFlwPlans(false); // Only auto-runs on mount/open if NOT already cached
    }
  }, [showPaymentModal]);

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
              email: activeUserEmail,
              includeAuth: includeAuth
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

  const showSubscriptionPaywallModal = () => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert("Payments temporarily unavailable. (Missing VITE_PAYSTACK_PUBLIC_KEY configuration)");
      return;
    }
    // @ts-ignore
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: publicKey,
      email: user?.email || 'user@example.com',
      amount: 100000, 
      /**
       * Paystack Subscription Plan Code:
       * "PLN_kh753o3e43u2fa3" corresponds to a pre-configured plan on Paystack.
       *
       * NOTE ON ENVIRONMENT VERIFICATION:
       * Whether this plan code belongs to a Live-Mode or Test-Mode environment
       * cannot be determined programmatically, as Paystack plan IDs use the same format
       * in both environments. To verify the environment type, check this plan code directly
       * within the Paystack Merchant Dashboard under "Plans" for the respective API keys in use.
       */
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

  const triggerSiteDeployment = (siteData: string) => {
    alert('Deployment Triggered: Pushing your site live...');
    // Real deployment logic would go here
  };

  const handlePublishClick = async () => {
    // 1. Check if user is subscribed via our active state
    if (!isProPlan) {
      // 2. If not subscribed, interrupt and open payment modal
      showSubscriptionPaywallModal();
    } else {
      // 3. If subscribed, trigger deployment
      triggerSiteDeployment(generatedCode);
    }
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
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-50 to-violet-50/20 text-slate-800 font-sans leading-normal tracking-normal antialiased">
      {/* SaaS Main Header Area */}
      <header className="bg-white/85 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 px-6 py-4 shadow-sm shadow-slate-100/20 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl shadow-md shadow-violet-100/60 transition-transform duration-300 hover:scale-105">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                WebCraft AI
              </h1>
              <p className="text-xs text-slate-500 font-bold tracking-wide">Enterprise AI SaaS Page & Asset Builder</p>
            </div>
          </div>

          {/* Billing, Credits Balance & Dynamic Auth Control Panel */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Database Staging Mode warning when table is missing */}
            {profile?.table_missing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-xs" title="Setup user_profiles and generations tables in Supabase for full features">
                <ShieldAlert size={12} />
                Offline Mode (No Tables)
              </span>
            )}

            {/* Supabase Connection Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border shadow-xs ${
              isSupabaseConfigured 
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`} title={`Supabase Project Reference: ${getSupabaseProjectRef()}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              DB: {getSupabaseProjectRef()}
            </span>

            {/* Live Credits display */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 shadow-xs">
              <Coins size={14} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              Credits:{' '}
              {profile ? (
                profile.plan_tier === 'pro' ? (
                  <span className="text-violet-600 font-black">Unlimited 🚀</span>
                ) : (
                  <span className="text-slate-900">{profile.media_credits} Left</span>
                )
              ) : (
                'Loading...'
              )}
            </span>

            {/* Plan Tier Status */}
            {isProPlan ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Plan: Pro Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                Plan: Free Staging
              </span>
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LogIn size={14} />
                Sync Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        isProPlan={isProPlan}
        setShowPaymentModal={setShowPaymentModal}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12 pb-24 md:pb-12">
        {activeView === 'builder' && (
          <BuilderView
            prompt={prompt}
            setPrompt={setPrompt}
            followUpPrompt={followUpPrompt}
            setFollowUpPrompt={setFollowUpPrompt}
            generatedCode={generatedCode}
            setGeneratedCode={setGeneratedCode}
            loading={loading}
            iframeSize={iframeSize}
            setIframeSize={setIframeSize}
            generationMode={generationMode}
            setGenerationMode={setGenerationMode}
            isProPlan={isProPlan}
            generatedMedia={generatedMedia}
            setGeneratedMedia={setGeneratedMedia}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            generateWebsite={generateWebsite}
            downloadCode={downloadCode}
            handlePublishClick={handlePublishClick}
            insertMediaIntoLayout={insertMediaIntoLayout}
            profile={profile}
            setShowPaymentModal={setShowPaymentModal}
            includeAuth={includeAuth}
            setIncludeAuth={setIncludeAuth}
          />
        )}

        {activeView === 'templates' && (
          <TemplatesView
            onSelectTemplate={(templatePrompt) => {
              setGenerationMode('layout');
              setPrompt(templatePrompt);
              setActiveView('builder');
              generateWebsite(false, templatePrompt);
            }}
          />
        )}

        {activeView === 'history' && (
          <HistoryView
            recentGenerations={recentGenerations}
            onLoadWebsite={(code) => {
              setGeneratedCode(code);
              setGeneratedMedia(null);
              setActiveTab('website');
              setActiveView('builder');
            }}
            onLoadMedia={(url, type) => {
              setGeneratedMedia({
                url,
                type,
                source: 'Supabase History'
              });
              setActiveTab('media');
              setActiveView('builder');
            }}
          />
        )}
      </main>

      {/* Sync Profile Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <UserCheck className="text-violet-600" size={20} />
              {isSignUp ? 'Create SaaS Account' : 'Sync Existing Profile'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">
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
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
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
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-100/50 hover:shadow-lg transition-all cursor-pointer mt-2"
              >
                {isSignUp ? 'Register Account' : 'Sign In and Sync'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-violet-600 font-bold hover:underline cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
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
              <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                🚀
              </div>
              
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Ready to Launch WebCraft AI Live?
              </h3>
              
              <p className="text-xs text-slate-600 mb-6 leading-relaxed font-medium">
                Your custom AI website workspace layout has generated successfully. To take this project live immediately with a premium dedicated hosting server and an officially registered custom domain node (.com, .org, .ng, etc.), tap below to spin up your instance.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  id="request-hosting-btn"
                  href={`https://t.me?text=${encodeURIComponent(`Hello Hassan, I would like to request hosting and domain setup for my WebCraft AI website layout. User email: ${user?.email || 'guest@example.com'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Dynamic Unified Payment Choice Modal Overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <Sparkles className="text-violet-600" size={20} />
              Choose Premium Upgrade Plan
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">
              Unlock the Pro Multi-Model SaaS Architect features, remove credit limits, and launch with unlimited capacity today using your preferred local gateway.
            </p>

            <div className="flex flex-col gap-6">
              {/* Paystack Column / Gateway Option - Commented out per project policy
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Paystack Checkout</h4>
                    <p className="text-[11px] text-slate-500">Standard One-Time / Monthly Flat</p>
                  </div>
                  <span className="text-xs font-black text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">
                    ₦1,000
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                  Gain Pro access and 100 media credits instantly with a secure, standard Paystack subscription checkout.
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    showSubscriptionPaywallModal();
                  }}
                  disabled={!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 ${
                    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
                      ? 'bg-slate-900 hover:bg-slate-850 cursor-pointer'
                      : 'bg-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? "Pay with Paystack" : "Paystack Temporarily Unavailable"}
                </button>
              </div>
              */}

              {/* Flutterwave Gateway Option */}
              <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-sm">Flutterwave Subscriptions</h4>
                    <p className="text-[11px] text-amber-700">Flexible Recurring Naira Billing</p>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                    Flutterwave
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { key: 'weekly', name: 'Weekly', price: '₦12,000', amount: 12000 },
                    { key: 'monthly', name: 'Monthly', price: '₦24,000', amount: 24000 },
                    { key: 'yearly', name: 'Yearly', price: '₦240,000', amount: 240000 }
                  ].map((plan) => (
                    <button
                      key={plan.key}
                      onClick={() => setSelectedFlwPlan(plan.key as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                        selectedFlwPlan === plan.key
                          ? 'bg-white border-amber-500 shadow-sm text-amber-900'
                          : 'bg-white/50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-black">{plan.name}</span>
                      <span className="text-xs font-bold text-slate-900 mt-1">{plan.price}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Subscribes you recurringly. Your account will be updated with your active subscription tiers automatically.
                </p>

                {/* Local Plans Caching and Admin Setup Script Control */}
                <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-amber-150/50 pt-2.5">
                  <span className="font-medium">
                    Plans status:{' '}
                    {loadingFlwPlans ? (
                      <span className="text-amber-600 font-bold animate-pulse">Syncing...</span>
                    ) : flwPlansError ? (
                      <span className="text-rose-600 font-bold">✗ Error loading plans</span>
                    ) : flwPlans.length > 0 ? (
                      <span className="text-emerald-600 font-bold">✓ Cached ({flwPlans.length} Plans)</span>
                    ) : (
                      <span className="text-slate-400">Not initialized</span>
                    )}
                  </span>
                  {import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY && (
                    <button
                      type="button"
                      onClick={() => syncFlwPlans(true)}
                      disabled={loadingFlwPlans}
                      className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
                      title="Forced Admin Sync: Fetch and establish plans on Flutterwave"
                    >
                      🔄 Admin Sync
                    </button>
                  )}
                </div>

                {flwPlansError && (
                  <div className="mb-4 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed max-h-32 overflow-y-auto">
                    <strong>Debug Error Details:</strong>
                    <br />
                    {flwPlansError}
                  </div>
                )}

                <button
                  onClick={async () => {
                    const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

                    // Define mapping of key to plan setup definitions
                    const flwPlansMapping: Record<string, { name: string; amount: number }> = {
                      weekly: { name: "WebCraft AI Weekly", amount: 12000 },
                      monthly: { name: "WebCraft AI Monthly", amount: 24000 },
                      yearly: { name: "WebCraft AI Yearly", amount: 240000 },
                    };

                    const selectedPlanData = flwPlansMapping[selectedFlwPlan];

                    if (!publicKey || flwPlansError || typeof (window as any).FlutterwaveCheckout !== "function") {
                      // Fallback: Sandbox simulation mode
                      console.log("[PAYMENT_SIMULATION] Simulating payment success since Flutterwave keys are unconfigured.");
                      setIsProPlan(true);
                      const activeUserId = user?.id || localStorage.getItem('webcraft_guest_id');
                      if (activeUserId) {
                        let creditsToAdd = 100;
                        if (selectedPlanData.amount >= 240000) creditsToAdd = 2000;
                        else if (selectedPlanData.amount >= 24000) creditsToAdd = 200;
                        else if (selectedPlanData.amount >= 12000) creditsToAdd = 50;

                        try {
                          const { data: currentProfile } = await supabase
                            .from('user_profiles')
                            .select('media_credits')
                            .eq('id', activeUserId)
                            .maybeSingle();

                          const existingCredits = currentProfile?.media_credits || 0;
                          
                          await supabase
                            .from('user_profiles')
                            .update({
                              plan_tier: 'pro',
                              media_credits: existingCredits + creditsToAdd
                            })
                            .eq('id', activeUserId);
                        } catch (e) {
                          console.warn("Local update simulated successfully:", e);
                        }
                      }
                      alert(`[Demo Mode] Payment simulation successful! Your WebCraft AI account is upgraded to Pro with +${selectedPlanData.amount >= 240000 ? 2000 : selectedPlanData.amount >= 24000 ? 200 : 50} credits.`);
                      setShowPaymentModal(false);
                      return;
                    }

                    // Find corresponding plan code returned from our Dynamic Plans creation endpoint
                    const matchedPlan = flwPlans.find(p => p.name.toLowerCase().includes(selectedFlwPlan));
                    const planId = matchedPlan ? matchedPlan.id : undefined;

                    // Standard Flutterwave checkout parameters
                    const txRef = `flw_tx_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

                    // @ts-ignore
                    if (typeof window.FlutterwaveCheckout === "function") {
                      // @ts-ignore
                      window.FlutterwaveCheckout({
                        public_key: publicKey,
                        tx_ref: txRef,
                        amount: selectedPlanData.amount,
                        currency: "NGN",
                        payment_plan: planId, // Pass created plan ID to configure subscription billing
                        customer: {
                          email: user?.email || 'guest@example.com',
                          name: user?.email?.split('@')[0] || 'Guest Builder',
                        },
                        meta: {
                          user_id: user?.id || localStorage.getItem('webcraft_guest_id') || 'guest_user',
                        },
                        customizations: {
                          title: "WebCraft AI Subscriptions",
                          description: `Recurring payment subscription: ${selectedPlanData.name}`,
                          logo: "https://checkout.flutterwave.com/assets/img/logo.svg",
                        },
                        callback: async function (response: any) {
                          console.log("Flutterwave transaction success response:", response);
                          if (response.status === "successful" || response.status === "completed") {
                            setIsProPlan(true);
                            // Also update locally immediately for better UX
                            const activeUserId = user?.id || localStorage.getItem('webcraft_guest_id');
                            if (activeUserId) {
                              let creditsToAdd = 100;
                              if (selectedPlanData.amount >= 240000) creditsToAdd = 2000;
                              else if (selectedPlanData.amount >= 24000) creditsToAdd = 200;
                              else if (selectedPlanData.amount >= 12000) creditsToAdd = 50;

                              try {
                                const { data: currentProfile } = await supabase
                                  .from('user_profiles')
                                  .select('media_credits')
                                  .eq('id', activeUserId)
                                  .maybeSingle();

                                const existingCredits = currentProfile?.media_credits || 0;
                                
                                await supabase
                                  .from('user_profiles')
                                  .update({
                                    plan_tier: 'pro',
                                    media_credits: existingCredits + creditsToAdd
                                  })
                                  .eq('id', activeUserId);
                              } catch (e) {
                                console.warn("Local cache update completed with alert fallback:", e);
                              }
                            }
                            alert(`Subscription success! Your WebCraft AI account is upgraded to Pro.`);
                            setShowPaymentModal(false);
                          }
                        },
                        onclose: function() {
                          console.log("Flutterwave inline checkout screen dismissed.");
                        }
                      });
                    } else {
                      alert("Flutterwave SDK failed to load. Please refresh the page and try again.");
                    }
                  }}
                  disabled={false}
                  className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 bg-amber-600 hover:bg-amber-700 hover:shadow-lg cursor-pointer flex items-center justify-center"
                >
                  {(!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || flwPlansError)
                    ? `Pay with Flutterwave [Demo Mode] (${selectedFlwPlan === 'weekly' ? '₦12k/Wk' : selectedFlwPlan === 'monthly' ? '₦24k/Mo' : '₦240k/Yr'})`
                    : `Pay with Flutterwave (${selectedFlwPlan === 'weekly' ? '₦12k/Wk' : selectedFlwPlan === 'monthly' ? '₦24k/Mo' : '₦240k/Yr'})`}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
