'use client';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

export default function SchedulePage() {
  const { t } = useI18n();
  const items = [
    { time: '09:00', title: 'Math', room: 'Room 201' },
    { time: '11:00', title: 'Science', room: 'Lab 3' },
    { time: '14:00', title: 'History', room: 'Room 105' },
  ];

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('schedule')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('schedule')}</h1>
              <p className="mt-2 text-sm text-muted">{t('today')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 fade-up delay-1">
            {items.map((item) => (
              <div key={item.time} className="soft-panel">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">{item.time}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.room}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
