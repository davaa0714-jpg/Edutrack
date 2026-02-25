'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

export default function SubjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'teacher') return router.replace('/dashboard');

      const { data } = await supabase.from('subjects').select('*').eq('teacher_id', userId).order('created_at', { ascending: false });
      if (data) setSubjects(data as Subject[]);
    };
    load();
  }, [router]);

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

          <section className="mt-6 grid grid-cols-4 gap-3 fade-up delay-1">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/subjects/${subject.id}`} className="soft-panel block aspect-square min-h-0 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-semibold">{subject.name}</p>
                <p className="mt-2 text-xs text-muted">{t('manageClasses')}</p>
              </Link>
            ))}
            {subjects.length === 0 && (
              <div className="soft-panel soft-panel-muted col-span-4">
                <p className="text-sm text-muted">{t('noSubjects')}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
