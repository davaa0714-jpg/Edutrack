'use client';
import { useI18n } from '@/lib/i18n';

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('mn')}
        className={`toggle-circle ${language === 'mn' ? 'active' : ''}`}
      >
        MN
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`toggle-circle ${language === 'en' ? 'active' : ''}`}
      >
        EN
      </button>
    </div>
  );
}
