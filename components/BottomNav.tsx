import React from 'react';
import { LayoutDashboard, PieChart, History } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
    { id: 'holdings', label: 'دارایی‌ها', icon: PieChart },
    { id: 'transactions', label: 'تراکنش‌ها', icon: History },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[520px] px-6 z-[60] pb-safe">
      <div className="rounded-[28px] flex justify-around items-center py-4 px-2 shadow-[0_16px_60px_rgba(24,45,85,0.45)] dark:shadow-[0_16px_60px_rgba(6,12,24,0.55)] backdrop-blur-[28px] saturate-150 bg-gradient-to-r from-white/75 via-white/60 to-white/70 dark:from-white/8 dark:via-white/12 dark:to-white/8 border border-white/55 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive ? 'text-blue-600 dark:text-blue-300 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.55)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-100/90 dark:bg-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.35)]' : 'bg-white/40 dark:bg-white/5'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
