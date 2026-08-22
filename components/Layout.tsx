import React from 'react';
import { NetworkStatus } from './NetworkStatus';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

export const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  return (
    <div
      className="min-h-screen flex flex-col relative transition-colors duration-300 bg-[var(--app-bg)] text-[color:var(--text-primary)]"
      data-theme={theme}
    >
      <NetworkStatus />
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12">
        {children}
      </div>
    </div>
  );
};
