import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  UserPlus,
  LogIn,
  AlertCircle,
  Zap,
  HelpCircle,
  RefreshCcw,
  Languages,
} from 'lucide-react';
import { API } from '../services/api';
import { SESSION_USER_KEY } from '../services/authService';
import { useTranslation } from '../contexts/LanguageContext';

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; isAdmin: boolean; displayName?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language, toggleLanguage } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFastLogin, setShowFastLogin] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loading) {
      timer = setTimeout(() => setShowFastLogin(true), 4000);
    } else {
      setShowFastLogin(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    let cancelled = false;
    let clearErrorTimer: ReturnType<typeof setTimeout> | undefined;
    if (!isForgot || !username) {
      setSecurityQuestion('');
      setError('');
      setQuestionLoading(false);
      return () => {};
    }
    const debounceTimer = setTimeout(async () => {
      setQuestionLoading(true);
      setError('');
      try {
        const question = await API.getSecurityQuestion(username);
        if (cancelled) return;
        setSecurityQuestion(question);
        setError('');
      } catch (err: any) {
        if (cancelled) return;
        setSecurityQuestion('');
        setError(
          err?.message ||
            (language === 'en' ? 'Could not retrieve security question' : 'دریافت سوال امنیتی ممکن نشد')
        );
        clearErrorTimer = setTimeout(() => {
          if (!cancelled) setError('');
        }, 2500);
      } finally {
        if (!cancelled) setQuestionLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      if (clearErrorTimer) clearTimeout(clearErrorTimer);
    };
  }, [username, isForgot, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setNotice('');

    const persistSessionUser = (sessionUser: {
      username: string;
      isAdmin: boolean;
      displayName?: string;
    }) => {
      localStorage.setItem(
        SESSION_USER_KEY,
        JSON.stringify({
          username: sessionUser.username,
          isAdmin: sessionUser.isAdmin,
          displayName: sessionUser.displayName,
        })
      );
    };

    try {
      if (isForgot) {
        if (!username) {
          throw new Error(language === 'en' ? 'Please enter username' : 'نام کاربری را وارد کنید');
        }
        if (!securityAnswer || !newPassword) {
          throw new Error(
            language === 'en'
              ? 'Please fill security answer and new password'
              : 'پاسخ امنیتی و گذرواژه جدید را تکمیل کنید'
          );
        }
        await API.resetPasswordWithSecurityAnswer(username, securityAnswer, newPassword);
        setNotice(
          language === 'en'
            ? 'Password reset successfully. You can now sign in.'
            : 'رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.'
        );
        setIsForgot(false);
        setPassword('');
        setNewPassword('');
        setSecurityAnswer('');
        setSecurityQuestion('');
      } else if (isRegister) {
        if (!securityQuestion || !securityAnswer) {
          throw new Error(
            language === 'en'
              ? 'Please complete security question and answer for account recovery'
              : 'لطفاً سوال و پاسخ امنیتی را برای بازیابی حساب تکمیل کنید'
          );
        }
        const user = await API.register(
          username,
          password,
          displayName || '',
          securityQuestion,
          securityAnswer
        );
        persistSessionUser(user!);
        onLoginSuccess(user!);
      } else {
        const user = await API.login(username, password);
        persistSessionUser(user);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(
        err.message ||
          (language === 'en' ? 'Invalid username or password' : 'نام کاربری یا رمز عبور اشتباه است')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFastLogin = () => {
    const user = {
      username: 'admin',
      isAdmin: true,
      displayName: language === 'en' ? 'System Admin' : 'ادمین سیستم',
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    onLoginSuccess(user);
  };

  const inputPad = language === 'en' ? 'pl-11 pr-4 text-left' : 'pr-11 pl-4 text-right';
  const iconSide = language === 'en' ? 'left-3.5' : 'right-3.5';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#090d16] text-slate-50 relative overflow-y-auto">
      {/* Subtle architectural radial glow in Bullion Gold */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.11) 0%, transparent 55%)',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10 modal-enter">
        <div className="bg-[#0f172a] border border-slate-800 rounded-[20px] p-6 sm:p-8 shadow-2xl relative">
          {/* Language Switcher */}
          <div className={`absolute top-5 ${language === 'en' ? 'right-5' : 'left-5'}`}>
            <button
              type="button"
              onClick={() => toggleLanguage()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors border border-slate-800"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            >
              <Languages size={14} className="text-amber-500" />
              <span>{language === 'fa' ? 'EN' : 'فا'}</span>
            </button>
          </div>

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8 pt-2">
            <div className="w-14 h-14 rounded-[20px] bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center font-extrabold text-xl shadow-gold mb-4">
              Z
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {isForgot
                ? language === 'en'
                  ? 'Reset Password'
                  : 'بازیابی رمز عبور'
                : isRegister
                  ? language === 'en'
                    ? 'Create Account'
                    : 'ایجاد حساب کاربری'
                  : language === 'en'
                    ? 'Zarfolio Terminal'
                    : 'ورود به زرفولیو'}
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1.5">
              {language === 'en'
                ? 'Gold, Currency & Crypto Wealth Tracker'
                : 'سامانه پایش دقیق طلا، سکه، ارز و رمزارز'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div
                className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
              >
                <User size={18} />
              </div>
              <input
                type="text"
                autoComplete="username"
                placeholder={language === 'en' ? 'Username' : 'نام کاربری'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                dir={language === 'en' ? 'ltr' : 'rtl'}
                required
              />
            </div>

            {isRegister && (
              <div className="relative group">
                <div
                  className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                >
                  <UserPlus size={18} />
                </div>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Display Name' : 'نام نمایشی در برنامه'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                  dir={language === 'en' ? 'ltr' : 'rtl'}
                />
              </div>
            )}

            {!isForgot && (
              <div className="relative group">
                <div
                  className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                >
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={language === 'en' ? 'Password' : 'رمز عبور'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                  dir={language === 'en' ? 'ltr' : 'rtl'}
                  required
                />
              </div>
            )}

            {isForgot && (
              <div className="space-y-3">
                <div className="relative">
                  <div
                    className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none`}
                  >
                    <HelpCircle size={18} className={questionLoading ? 'animate-pulse' : ''} />
                  </div>
                  <input
                    type="text"
                    value={
                      securityQuestion ||
                      (questionLoading
                        ? language === 'en'
                          ? 'Loading...'
                          : 'در حال دریافت...'
                        : '')
                    }
                    readOnly
                    placeholder={
                      language === 'en'
                        ? 'Security question will appear here'
                        : 'سوال امنیتی نمایش داده می‌شود'
                    }
                    className={`w-full min-h-[46px] bg-slate-900/60 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-medium text-slate-300 placeholder:text-slate-500 focus:outline-none`}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                  />
                </div>
                <div className="relative group">
                  <div
                    className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Security Answer' : 'پاسخ امنیتی'}
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                    required
                  />
                </div>
                <div className="relative group">
                  <div
                    className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={language === 'en' ? 'New Password' : 'رمز عبور جدید'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                    required
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="space-y-3">
                <div className="relative group">
                  <div
                    className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                  >
                    <HelpCircle size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Your Security Question' : 'سوال امنیتی شما'}
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                    required
                  />
                </div>
                <div className="relative group">
                  <div
                    className={`absolute ${iconSide} top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none`}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Security Answer' : 'پاسخ امنیتی'}
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className={`w-full min-h-[46px] bg-slate-900/90 border border-slate-800 rounded-xl py-3 ${inputPad} text-base sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
                    dir={language === 'en' ? 'ltr' : 'rtl'}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-2"
              >
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-2"
              >
                <ShieldCheck size={15} className="shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-gold disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isForgot
                      ? language === 'en'
                        ? 'Reset Password'
                        : 'بازیابی رمز عبور'
                      : isRegister
                        ? language === 'en'
                          ? 'Register & Enter'
                          : 'ثبت‌نام و ورود'
                        : language === 'en'
                          ? 'Sign In'
                          : 'ورود به حساب'}
                  </span>
                  {isForgot ? (
                    <RefreshCcw size={17} />
                  ) : isRegister ? (
                    <UserPlus size={17} />
                  ) : (
                    <LogIn size={17} />
                  )}
                </>
              )}
            </button>

            {showFastLogin && (
              <button
                type="button"
                onClick={handleFastLogin}
                className="w-full min-h-[44px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 mt-2"
              >
                <Zap size={16} />
                <span>
                  {language === 'en' ? 'Emergency Local Access' : 'ورود اضطراری (حالت آفلاین)'}
                </span>
              </button>
            )}

            <div className="pt-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setIsForgot(false);
                  setError('');
                  setNotice('');
                  setSecurityQuestion('');
                  setSecurityAnswer('');
                  setNewPassword('');
                }}
                className="w-full min-h-[40px] text-slate-400 text-xs font-semibold hover:text-white transition-colors"
              >
                {isRegister
                  ? language === 'en'
                    ? 'Already have an account? Sign in'
                    : 'قبلاً حساب داشته‌اید؟ وارد شوید'
                  : language === 'en'
                    ? "Don't have an account? Register"
                    : 'حساب کاربری ندارید؟ ثبت‌نام کنید'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsForgot(!isForgot);
                  setIsRegister(false);
                  setError('');
                  setNotice('');
                  setSecurityQuestion('');
                  setSecurityAnswer('');
                  setNewPassword('');
                  setPassword('');
                }}
                className="w-full min-h-[40px] text-slate-400 text-xs font-semibold hover:text-white transition-colors"
              >
                {isForgot
                  ? language === 'en'
                    ? 'Back to Sign In'
                    : 'بازگشت به فرم ورود'
                  : language === 'en'
                    ? 'Forgot your password?'
                    : 'رمز عبور را فراموش کرده‌اید؟'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
