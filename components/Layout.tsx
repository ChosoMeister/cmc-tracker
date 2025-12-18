import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </main>
    </div>
  );
};