import React from 'react';
import { NetworkStatus } from './NetworkStatus';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  navbar?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, theme, navbar }) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col relative transition-colors duration-300 bg-[var(--app-bg)] text-[color:var(--text-primary)]"
      data-theme={theme}
    >
      <NetworkStatus />
      {navbar}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  );
};
