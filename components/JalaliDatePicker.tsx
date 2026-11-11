import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import jalaali from 'jalaali-js';
import { ChevronRight, ChevronLeft, ChevronDown, Calendar } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface JalaliDatePickerProps {
  value: string; // ISO date string (Gregorian YYYY-MM-DD)
  onChange: (isoDate: string) => void;
  placeholder?: string;
}

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const toPersianDigits = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

const getDaysInJalaliMonth = (jy: number, jm: number): number => {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
};

const getFirstDayOfMonth = (jy: number, jm: number): number => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, 1);
  const date = new Date(gy, gm - 1, gd);
  return (date.getDay() + 1) % 7;
};

type ViewMode = 'days' | 'months' | 'years';

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
}) => {
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1404);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState<{ jy: number; jm: number; jd: number } | null>(
    null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [yearRangeStart, setYearRangeStart] = useState(1396);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const { jy, jm, jd } = jalaali.toJalaali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      setSelectedDate({ jy, jm, jd });
      setCurrentYear(jy);
      setCurrentMonth(jm);
      setYearRangeStart(Math.floor(jy / 12) * 12);
    } else {
      const today = new Date();
      const { jy, jm } = jalaali.toJalaali(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      setCurrentYear(jy);
      setCurrentMonth(jm);
      setYearRangeStart(Math.floor(jy / 12) * 12);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    setViewMode('days');
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Native Gregorian input when English locale is active
  if (language === 'en') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)] tabular-nums"
        dir="ltr"
      />
    );
  }

  const handleDayClick = (day: number) => {
    const { gy, gm, gd } = jalaali.toGregorian(currentYear, currentMonth, day);
    const isoDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
    setSelectedDate({ jy: currentYear, jm: currentMonth, jd: day });
    onChange(isoDate);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const displayValue = selectedDate
    ? `${toPersianDigits(selectedDate.jy)}/${toPersianDigits(
        selectedDate.jm.toString().padStart(2, '0')
      )}/${toPersianDigits(selectedDate.jd.toString().padStart(2, '0'))}`
    : '';

  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  const calendarPopup =
    isOpen &&
    ReactDOM.createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="تقویم شمسی"
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        onClick={() => setIsOpen(false)}
      >
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm backdrop-enter" />
        <div
          className="relative z-10 w-full max-w-xs bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] shadow-2xl overflow-hidden modal-enter"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[color:var(--border-color)] bg-[var(--muted-surface)]">
            {viewMode === 'days' && (
              <>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                  aria-label="ماه بعد"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('months')}
                  className="font-bold text-sm text-[color:var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1"
                >
                  {persianMonths[currentMonth - 1]} {toPersianDigits(currentYear)}
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                  aria-label="ماه قبل"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
            {viewMode === 'months' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentYear(currentYear + 1)}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('years')}
                  className="font-bold text-sm text-[color:var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1"
                >
                  {toPersianDigits(currentYear)}
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentYear(currentYear - 1)}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
            {viewMode === 'years' && (
              <>
                <button
                  type="button"
                  onClick={() => setYearRangeStart(yearRangeStart + 12)}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="font-bold text-sm text-[color:var(--text-primary)] tabular-nums">
                  {toPersianDigits(yearRangeStart)} - {toPersianDigits(yearRangeStart + 11)}
                </div>
                <button
                  type="button"
                  onClick={() => setYearRangeStart(yearRangeStart - 12)}
                  className="p-2 rounded-xl hover:bg-[var(--pill-bg)] transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
          </div>

          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 p-3 border-b border-[color:var(--border-color)]">
                {persianWeekDays.map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-bold text-[color:var(--text-muted)] py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 p-3">
                {days.map((day, i) => (
                  <div key={i} className="aspect-square">
                    {day && (
                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`w-full h-full rounded-xl text-xs font-bold transition-colors flex items-center justify-center tabular-nums ${
                          selectedDate?.jy === currentYear &&
                          selectedDate?.jm === currentMonth &&
                          selectedDate?.jd === day
                            ? 'bg-[var(--brand-primary)] text-white shadow-gold'
                            : 'hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                        }`}
                      >
                        {toPersianDigits(day)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 p-4">
              {persianMonths.map((month, i) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(i + 1);
                    setViewMode('days');
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition-colors ${
                    currentMonth === i + 1
                      ? 'bg-[var(--brand-primary)] text-white shadow-gold'
                      : 'hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2 p-4">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setCurrentYear(year);
                    setViewMode('months');
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition-colors tabular-nums ${
                    currentYear === year
                      ? 'bg-[var(--brand-primary)] text-white shadow-gold'
                      : 'hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                  }`}
                >
                  {toPersianDigits(year)}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-[color:var(--border-color)] flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const { jy, jm, jd } = jalaali.toJalaali(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  today.getDate()
                );
                setCurrentYear(jy);
                setCurrentMonth(jm);
                handleDayClick(jd);
              }}
              className="flex-1 min-h-[40px] text-xs font-bold text-[var(--brand-primary)] bg-[var(--brand-soft)] border border-[var(--brand-border)] rounded-xl transition-colors"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-[40px] px-4 text-xs font-bold text-[color:var(--text-muted)] bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] rounded-xl transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold cursor-pointer flex items-center justify-between gap-2 hover:border-[var(--brand-border)] transition-colors text-[color:var(--text-primary)] tabular-nums"
      >
        <span className={displayValue ? '' : 'text-[color:var(--text-muted)]'}>
          {displayValue || placeholder}
        </span>
        <Calendar size={16} className="text-[color:var(--text-muted)] shrink-0" />
      </button>

      {calendarPopup}
    </>
  );
};
