'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Grade } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type GradeWithSubject = Grade & { subjects?: { name: string }[] | null };

export default function StudentGradesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'student') return router.replace('/dashboard');

      const { data } = await supabase
        .from('grades')
        .select('id, score, subject_id, student_id, created_at, subjects(name)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });
      if (data) setGrades(data as GradeWithSubject[]);
    };
    load();
  }, [router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('myGrades')}</h1>
          <div className="mt-6 table-shell fade-up delay-1">
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
                    <td className="px-4 py-3">{g.subjects?.[0]?.name || t('unknown')}</td>
                    <td className="px-4 py-3">{g.score}</td>
                    <td className="px-4 py-3">{new Date(g.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

