'use client';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('settings')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('settings')}</h1>
              <p className="mt-2 text-sm text-muted">{t('rolesAndAccess')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 grid gap-6 lg:grid-cols-2 fade-up delay-1">
            <div className="soft-panel">
              <h2 className="text-sm font-semibold">Theme</h2>
              <p className="mt-2 text-sm text-muted">Switch between light and dark</p>
              <div className="mt-4">
                <ToggleGroup />
              </div>
            </div>
            <div className="soft-panel">
              <h2 className="text-sm font-semibold">Language</h2>
              <p className="mt-2 text-sm text-muted">Choose MN / EN</p>
              <div className="mt-4">
                <ToggleGroup />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
