import React, { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const THRESHOLD = 80;
  const MAX_PULL = 110;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Check actual window scroll position so scrolling up mid-page is NEVER hijacked
    const windowScrollTop = typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop : 0;
    if (windowScrollTop <= 2) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || disabled || isRefreshing) return;
    const windowScrollTop = typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop : 0;
    if (windowScrollTop > 2) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 8) {
      const distance = Math.min((diff - 8) * 0.45, MAX_PULL);
      setPullDistance(distance);
    } else if (pullDistance !== 0) {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current || disabled) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(44);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* GPU-transformed Pull Indicator (No layout-thrashing `top` animation or overflow clipping) */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 z-50 pointer-events-none flex items-center justify-center"
          style={{
            top: '4.5rem',
            opacity: isRefreshing ? 1 : progress,
            transform: `translate3d(-50%, ${Math.min(pullDistance * 0.4, 36)}px, 0)`,
          }}
        >
          <div
            className={`w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[color:var(--border-color)] shadow-lg flex items-center justify-center ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw
              size={18}
              className="text-[var(--brand-primary)]"
              style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance}px, 0)` : undefined,
          transition: pulling.current ? 'none' : 'transform 180ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
