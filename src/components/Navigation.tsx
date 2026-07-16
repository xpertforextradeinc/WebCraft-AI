import React from 'react';
import { Layout, Palette, History, CreditCard, Sparkles } from 'lucide-react';

interface NavigationProps {
  activeView: 'builder' | 'templates' | 'history';
  setActiveView: (view: 'builder' | 'templates' | 'history') => void;
  isProPlan: boolean;
  setShowPaymentModal: (show: boolean) => void;
}

export default function Navigation({
  activeView,
  setActiveView,
  isProPlan,
  setShowPaymentModal,
}: NavigationProps) {
  const tabs = [
    { id: 'builder' as const, label: 'Builder', icon: Layout },
    { id: 'templates' as const, label: 'Templates', icon: Palette },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <>
      {/* Desktop Persistent Top Nav Area / Sub-header */}
      <nav className="bg-white border-b border-slate-200 py-1 px-6 shadow-xs hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-1.5">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <IconComp size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!isProPlan && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/80 rounded-xl text-xs font-extrabold text-violet-700 hover:bg-violet-100/50 cursor-pointer transition-all"
            >
              <Sparkles size={12} className="animate-pulse" />
              Upgrade to Pro
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden flex justify-around py-2 px-4 shadow-lg">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-black transition-all cursor-pointer ${
                isActive ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IconComp size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <CreditCard size={18} className={!isProPlan ? "text-violet-600 animate-pulse" : "text-slate-400"} />
          <span>Upgrade</span>
        </button>
      </div>
    </>
  );
}
