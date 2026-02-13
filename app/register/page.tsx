'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import { Icon } from '@/app/components/Icons';

export default function RegisterPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return alert('Email hooson baina');
    setIsSubmitting(true);

    const computedFullName = `${lastName} ${firstName}`.trim();
    if (!computedFullName) {
      setIsSubmitting(false);
      return alert('Ovog, neree oruulna uu');
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: computedFullName,
          first_name: firstName || null,
          last_name: lastName || null,
          class_name: className || null,
          role: 'student',
          phone: phone || null,
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      return alert(error.message);
    }
    if (data.user) {
      setIsSubmitting(false);
      alert('Burtgel amjilttai! Email-ee shalgaj batалгаажуулна uu.');
      router.push('/login');
    }
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
                <p className="text-sm font-semibold">{t('joinTitle')}</p>
              </div>
            </div>
            <ToggleGroup />
          </div>

          <h1 className="hex-title mt-5">{t('joinTitle')}</h1>
          <p className="hex-sub">{t('joinSubtitle')}</p>

          <div className="hex-stack">
            <label className="block">
              <span className="form-label">Ovog</span>
              <input
                type="text"
                placeholder="Bat"
                className="input-field mt-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Ner</span>
              <input
                type="text"
                placeholder="Munkh"
                className="input-field mt-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Angi</span>
              <input
                type="text"
                placeholder="10A"
                className="input-field mt-2"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </label>
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
                placeholder={t('passwordPlaceholder')}
                className="input-field mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Phone</span>
              <input
                type="tel"
                placeholder="99001122"
                className="input-field mt-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          <button onClick={handleRegister} className="hex-btn mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Tur huleene uu...' : t('createAccount')}
          </button>
          <div className="mt-5 space-y-2 text-xs text-muted">
            <p className="font-semibold">{t('benefitsTitle')}</p>
            <p>- {t('benefit1')}</p>
            <p>- {t('benefit2')}</p>
            <p>- {t('benefit3')}</p>
          </div>
          <p className="mt-4 text-xs text-muted">{t('policyNote')}</p>
        </div>
      </div>
    </div>
  );
}
