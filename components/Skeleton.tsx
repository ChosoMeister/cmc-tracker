import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({ className = '', shimmer = true }) => (
  <div className={`relative overflow-hidden bg-[var(--muted-surface)] rounded-lg ${className}`}>
    {shimmer && (
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    )}
  </div>
);

export const Skeleton = memo(SkeletonComponent);

/**
 * Full 12-column Overview Skeleton matching the real layout geometry (prevents CLS on data load)
 */
export const SummaryCardSkeleton = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-8 space-y-6">
      {/* Hero Summary Card Skeleton */}
      <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-6 sm:p-7 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="w-36 h-6 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="w-72 sm:w-96 h-12 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="w-28 h-7 rounded-xl" />
            <Skeleton className="w-36 h-7 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>

      {/* Growth Chart Skeleton */}
      <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-44 h-6 rounded-lg" />
          <Skeleton className="w-48 h-8 rounded-xl" />
        </div>
        <Skeleton className="w-full h-[220px] rounded-xl" />
      </div>
    </div>

    <div className="lg:col-span-4 space-y-6">
      <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-6 space-y-4">
        <Skeleton className="w-36 h-5 rounded-lg" />
        <div className="flex justify-center py-4">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="w-full h-28 rounded-[20px]" />
      <Skeleton className="w-full h-28 rounded-[20px]" />
    </div>
  </div>
));
SummaryCardSkeleton.displayName = 'SummaryCardSkeleton';

export const AssetRowSkeleton = memo(() => (
  <div className="p-4 flex items-center justify-between border border-[color:var(--border-color)] rounded-[20px] bg-[var(--card-bg)]">
    <div className="flex items-center gap-3.5">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>
    </div>
    <div className="flex flex-col items-end space-y-2">
      <Skeleton className="w-28 h-4 rounded-md" />
      <Skeleton className="w-16 h-5 rounded-lg" />
    </div>
  </div>
));
AssetRowSkeleton.displayName = 'AssetRowSkeleton';
