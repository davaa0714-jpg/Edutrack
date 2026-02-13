'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

export default function SubjectsPage() {
  const { t } = useI18n();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('subjects').select('*');
      if (data) setSubjects(data as Subject[]);
    };
    load();
  }, []);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('subjects')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('subjects')}</h1>
              <p className="mt-2 text-sm text-muted">{subjects.length} {t('subjects')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 fade-up delay-1">
            {subjects.map((subject) => (
              <div key={subject.id} className="soft-panel">
                <p className="text-sm font-semibold">{subject.name}</p>
                <p className="mt-2 text-xs text-muted">{t('manageClasses')}</p>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="soft-panel soft-panel-muted">
                <p className="text-sm text-muted">{t('noSubjects')}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
