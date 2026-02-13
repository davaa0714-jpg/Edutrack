'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Attendance } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

interface AttendanceWithSubject extends Attendance { subjects: { name: string }[]; }

export default function AttendancePage() {
  const { t } = useI18n();
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('attendance')
        .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
        .eq('student_id', userId);
      if (data) setAttendance(data as AttendanceWithSubject[]);
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
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('attendance')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('attendance')}</h1>
              <p className="mt-2 text-sm text-muted">{attendance.length || 0} {t('records')}</p>
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
                    <th className="px-4 py-3 text-left font-medium">{t('date')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('subject')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.id} className="border-t border-[color:var(--card-border)] zebra">
                      <td className="px-4 py-3">{a.date}</td>
                      <td className="px-4 py-3">{a.subjects[0]?.name || t('unknown')}</td>
                      <td className="px-4 py-3"><span className="tag">{a.status}</span></td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr className="border-t border-[color:var(--card-border)]">
                      <td className="px-4 py-6 text-sm text-muted" colSpan={3}>
                        {t('noAttendance')}
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
