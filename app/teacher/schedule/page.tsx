'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Schedule } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type RelationName = { name: string } | { name: string }[] | null | undefined;
type ScheduleWithMeta = Schedule & { subjects?: RelationName; classes?: RelationName };
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
type SubjectCard = { id: number; name: string; sessions: number };

export default function TeacherSchedulePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ScheduleWithMeta[]>([]);
  const [subjectCards, setSubjectCards] = useState<SubjectCard[]>([]);

  const getRelationName = (value: RelationName) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0]?.name || null;
    return value.name || null;
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'teacher') return router.replace('/dashboard');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return setItems([]);

      const res = await fetch('/api/teacher/schedule', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(payload.items)) {
        const rows = payload.items as ScheduleWithMeta[];
        setItems(rows);
        const grouped = new Map<number, SubjectCard>();
        rows.forEach((r) => {
          if (!r.subject_id) return;
          const name = getRelationName(r.subjects) || t('unknown');
          const found = grouped.get(r.subject_id);
          if (found) found.sessions += 1;
          else grouped.set(r.subject_id, { id: r.subject_id, name, sessions: 1 });
        });
        setSubjectCards(Array.from(grouped.values()));
      } else {
        setItems([]);
        setSubjectCards([]);
      }
    };

    load();
  }, [router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('schedule')}</h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 fade-up delay-1">
            {subjectCards.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/schedule/subject/${s.id}`}
                className="soft-panel soft-panel-muted block aspect-square min-h-0 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-semibold">{s.name}</p>
                <p className="mt-1 text-xs text-muted">{s.sessions} хуваарь</p>
              </Link>
            ))}
            {subjectCards.length === 0 && <div className="soft-panel soft-panel-muted text-sm text-muted col-span-4">{t('noSubjects')}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

