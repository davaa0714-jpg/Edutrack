'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Schedule } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type ScheduleWithMeta = Schedule & { subjects?: { name: string } | null; classes?: { name: string } | null };

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StudentSchedulePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ScheduleWithMeta[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'student') return router.replace('/dashboard');

      const { data: memberships } = await supabase.from('class_memberships').select('class_id').eq('student_id', userId);
      const classIds = (memberships || []).map((m) => m.class_id);
      if (classIds.length === 0) return setItems([]);

      const { data } = await supabase
        .from('schedules')
        .select('id, day_of_week, start_time, end_time, room, class_id, subject_id, created_at, subjects(name), classes(name)')
        .in('class_id', classIds)
        .order('day_of_week', { ascending: true });
      if (data) setItems(data as ScheduleWithMeta[]);
    };
    load();
  }, [router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('schedule')}</h1>
          <div className="mt-6 space-y-3 fade-up delay-1">
            {items.map((s) => (
              <div key={s.id} className="soft-panel soft-panel-muted">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.subjects?.name || t('unknown')}</p>
                  <span className="tag">{s.classes?.name || 'Class'}</span>
                </div>
                <p className="text-sm text-muted">
                  {days[(s.day_of_week || 1) - 1]} · {s.start_time} - {s.end_time} · {s.room || 'Room'}
                </p>
              </div>
            ))}
            {items.length === 0 && <div className="soft-panel soft-panel-muted text-sm text-muted">{t('noSubjects')}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
