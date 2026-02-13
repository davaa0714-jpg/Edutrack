'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Grade } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

interface GradeWithSubject extends Grade { subjects: { name: string }[]; }

export default function GradesPage() {
  const { t } = useI18n();
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('grades')
        .select('id, score, subject_id, student_id, created_at, subjects(name)')
        .eq('student_id', userId);
      if (data) setGrades(data as GradeWithSubject[]);
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
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('grades')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('grades')}</h1>
              <p className="mt-2 text-sm text-muted">{grades.length || 0} {t('records')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 soft-panel fade-up delay-1">
            <div className="table-shell">
              <table className="min-w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t('subject')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('score')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g.id} className="border-t border-[color:var(--card-border)] zebra">
                      <td className="px-4 py-3">{g.subjects[0]?.name || t('unknown')}</td>
                      <td className="px-4 py-3"><span className="tag">{g.score}</span></td>
                      <td className="px-4 py-3 text-muted">{g.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr className="border-t border-[color:var(--card-border)]">
                      <td className="px-4 py-6 text-sm text-muted" colSpan={3}>
                        {t('noGrades')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
