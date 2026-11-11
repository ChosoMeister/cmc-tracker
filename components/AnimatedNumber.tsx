import React, { memo, useEffect, useRef } from 'react';
import { formatToman, formatPercent } from '../utils/formatting';
import { useTranslation } from '../contexts/LanguageContext';

interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

const AnimatedNumberComponent: React.FC<AnimatedNumberProps> = ({
  value,
  formatter,
  duration = 420,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const { language } = useTranslation();
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);
  const isFirstMountRef = useRef<boolean>(true);

  const formatFn = (v: number) => {
    if (formatter) return formatter(v);
    return formatToman(v, language);
  };

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFirstMountRef.current || prefersReducedMotion || duration <= 0) {
      isFirstMountRef.current = false;
      prevValueRef.current = value;
      el.textContent = `${prefix}${formatFn(value)}${suffix}`;
      return;
    }

    const from = prevValueRef.current;
    const to = value;
    prevValueRef.current = value;

    if (from === to) {
      el.textContent = `${prefix}${formatFn(to)}${suffix}`;
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const current = from + (to - from) * eased;
      el.textContent = `${prefix}${formatFn(current)}${suffix}`;
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, language, prefix, suffix, duration]);

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`} dir="ltr">
      {`${prefix}${formatFn(value)}${suffix}`}
    </span>
  );
};

export const AnimatedNumber = memo(AnimatedNumberComponent);

interface AnimatedTomanProps {
  value: number;
  className?: string;
  showSuffix?: boolean;
}

const AnimatedTomanComponent: React.FC<AnimatedTomanProps> = ({
  value,
  className = '',
  showSuffix = true,
}) => {
  const { language, t } = useTranslation();

  return (
    <AnimatedNumber
      value={value}
      formatter={(v) => formatToman(v, language)}
      className={className}
      suffix={showSuffix ? ` ${t('common.toman')}` : ''}
    />
  );
};

export const AnimatedToman = memo(AnimatedTomanComponent);

interface AnimatedPercentProps {
  value: number;
  className?: string;
}

const AnimatedPercentComponent: React.FC<AnimatedPercentProps> = ({
  value,
  className = '',
}) => {
  const { language } = useTranslation();

  return (
    <AnimatedNumber
      value={value}
      formatter={(v) => formatPercent(v, language)}
      className={className}
    />
  );
};

export const AnimatedPercent = memo(AnimatedPercentComponent);
