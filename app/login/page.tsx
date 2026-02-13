'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import { Icon } from '@/app/components/Icons';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return alert(error.message);

    const userId = data.user?.id;
    if (!userId) return router.push('/dashboard');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role === 'admin') return router.push('/admin/dashboard');
    if (profile?.role === 'teacher') return router.push('/teacher/dashboard');
    return router.push('/student/dashboard');
  };

  return (
    <div className="hex-hero app-bg">
      <div className="hex-bubble b1" />
      <div className="hex-bubble b2" />
      <div className="hex-bubble b3" />

      <div className="hex-card fade-up">
        <div className="hex-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="dash-logo">
                <Icon.Spark />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{t('appName')}</p>
                <p className="text-sm font-semibold">{t('loginWelcome')}</p>
              </div>
            </div>
            <ToggleGroup />
          </div>

          <h1 className="hex-title mt-5">{t('signInTitle')}</h1>
          <p className="hex-sub">{t('signInSubtitle')}</p>

          <div className="hex-stack">
            <label className="block">
              <span className="form-label">{t('email')}</span>
              <input
                type="email"
                placeholder="you@school.edu"
                className="input-field mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">{t('password')}</span>
              <input
                type="password"
                placeholder="********"
                className="input-field mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <button onClick={handleLogin} className="hex-btn mt-4">
            {t('login')}
          </button>
          <div className="mt-5 space-y-2 text-xs text-muted">
            <p className="font-semibold">{t('loginTagline')}</p>
            <p>- {t('loginBullet1')}</p>
            <p>- {t('loginBullet2')}</p>
            <p>- {t('loginBullet3')}</p>
          </div>
          <p className="mt-4 text-xs text-muted">{t('loginFooter')}</p>
        </div>
      </div>
    </div>
  );
}
