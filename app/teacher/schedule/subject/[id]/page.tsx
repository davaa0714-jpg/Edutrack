'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Schedule } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type RelationName = { name: string } | { name: string }[] | null | undefined;
type ScheduleWithMeta = Schedule & { subjects?: RelationName; classes?: RelationName };

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getRelationName = (value: RelationName) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name || null;
  return value.name || null;
};

export default function TeacherSubjectSchedulePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [items, setItems] = useState<ScheduleWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const subjectId = Number(params?.id);
      if (!subjectId) return router.replace('/teacher/schedule');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch('/api/teacher/schedule', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load schedules');
        return router.replace('/teacher/schedule');
      }

      const rows = ((payload.items || []) as ScheduleWithMeta[]).filter((r) => r.subject_id === subjectId);
      setItems(rows);
      setLoading(false);
    };
    load();
  }, [params?.id, router]);

  const subjectName = useMemo(() => {
    const first = items[0];
    return first ? getRelationName(first.subjects) || t('unknown') : '...';
  }, [items, t]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('schedule')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{subjectName}</h1>
              <p className="mt-2 text-sm text-muted">{items.length} С…РёС‡СЌСЌР»РёР№РЅ С†Р°Рі</p>
            </div>
            <Link href="/teacher/schedule" className="nav-pill">{t('schedule')}</Link>
          </header>

          <section className="mt-6 grid grid-cols-4 gap-3 fade-up delay-1">
            {items.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/schedule/${s.id}`}
                className="soft-panel soft-panel-muted block aspect-square min-h-0 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-semibold">{getRelationName(s.classes) || 'Class'}</p>
                <p className="mt-2 text-sm text-muted">
                  {days[(s.day_of_week || 1) - 1]} В· {s.start_time}-{s.end_time}
                </p>
                <p className="mt-1 text-sm text-muted">{s.room || 'Room'}</p>
              </Link>
            ))}
            {!loading && items.length === 0 && (
              <div className="soft-panel soft-panel-muted col-span-4 text-sm text-muted">Р­РЅСЌ С…РёС‡СЌСЌР»Рґ С…СѓРІР°Р°СЂСЊ Р°Р»РіР°.</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

