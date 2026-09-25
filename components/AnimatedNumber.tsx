
import React, { memo, useEffect, useRef, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
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
    duration = 500,
    className = '',
    prefix = '',
    suffix = ''
}) => {
    const { language } = useTranslation();
    const prevValue = useRef(value);
    const [isFirstRender, setIsFirstRender] = useState(true);

    const defaultFormatter = (v: number) => {
        const locale = language === 'en' ? 'en-US' : 'fa-IR';
        return v.toLocaleString(locale);
    };

    const activeFormatter = formatter || defaultFormatter;

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
        }
        prevValue.current = value;
    }, [value, isFirstRender]);

    const { number } = useSpring({
        from: { number: isFirstRender ? value : prevValue.current },
        to: { number: value },
        config: { ...config.gentle, duration },
    });

    return (
        <animated.span className={className} dir="ltr">
            {number.to((n) => `${prefix}${activeFormatter(Math.floor(n))}${suffix}`)}
        </animated.span>
    );
};

export const AnimatedNumber = memo(AnimatedNumberComponent);

// Animated Toman formatter
interface AnimatedTomanProps {
    value: number;
    className?: string;
    showSuffix?: boolean;
}

const AnimatedTomanComponent: React.FC<AnimatedTomanProps> = ({
    value,
    className = '',
    showSuffix = true
}) => {
    const { language, t } = useTranslation();
    const locale = language === 'en' ? 'en-US' : 'fa-IR';

    return (
        <AnimatedNumber
            value={value}
            formatter={(v) => new Intl.NumberFormat(locale).format(Math.round(v))}
            className={className}
            suffix={showSuffix ? ` ${t('common.toman')}` : ''}
        />
    );
};

export const AnimatedToman = memo(AnimatedTomanComponent);

// Animated Percent formatter
interface AnimatedPercentProps {
    value: number;
    className?: string;
    showSign?: boolean;
}

const AnimatedPercentComponent: React.FC<AnimatedPercentProps> = ({
    value,
    className = '',
    showSign = true
}) => {
    const { language } = useTranslation();
    const sign = showSign && value > 0 ? '+' : '';
    const locale = language === 'en' ? 'en-US' : 'fa-IR';
    const percentSymbol = language === 'en' ? '%' : '٪';

    return (
        <AnimatedNumber
            value={value}
            formatter={(v) => `${sign}${new Intl.NumberFormat(locale, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            }).format(v)}${percentSymbol}`}
            className={className}
        />
    );
};

export const AnimatedPercent = memo(AnimatedPercentComponent);

