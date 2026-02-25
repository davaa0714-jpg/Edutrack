'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type ScheduleDetail = {
  schedule: {
    id: number;
    subjectId: number;
    subjectName: string;
    classId: number;
    className: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
  };
  students: Array<{ id: string; name: string; status: string | null }>;
  studentCount: number;
  date: string;
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TeacherScheduleDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const statusLabel = (status: string | null) => {
    if (status === 'present') return 'Ирсэн';
    if (status === 'absent') return 'Тасалсан';
    if (status === 'sick') return 'Өвчтэй';
    if (status === 'excused') return 'Чөлөөтэй';
    if (status === 'late') return 'Хоцорсон';
    return '-';
  };

  useEffect(() => {
    const load = async () => {
      const scheduleId = Number(params?.id);
      if (!scheduleId) return router.replace('/teacher/schedule');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch(`/api/teacher/schedule/${scheduleId}?date=${date}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load schedule details');
        return router.replace('/teacher/schedule');
      }
      setData(payload as ScheduleDetail);
      setLoading(false);
    };
    load();
  }, [params?.id, router, date]);

  const d = data?.schedule;

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('schedule')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{d?.subjectName || '...'}</h1>
              <p className="mt-2 text-sm text-muted">
                {d ? `${d.className} - ${days[(d.dayOfWeek || 1) - 1]} ${d.startTime}-${d.endTime}${d.room ? ` - ${d.room}` : ''}` : 'Loading...'}
              </p>
            </div>
            <Link href="/teacher/schedule" className="nav-pill">{t('schedule')}</Link>
          </header>

          <section className="mt-6 soft-panel fade-up delay-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{'\u0410\u043d\u0433\u0438'}: <b>{d?.className || '-'}</b></p>
              <span className="tag">{data?.studentCount || 0} {'\u0441\u0443\u0440\u0430\u0433\u0447'}</span>
            </div>
            <div className="mt-3">
              <input className="input-field max-w-[220px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {(data?.students || []).map((s) => (
                <div key={s.id} className="soft-panel soft-panel-muted aspect-square min-h-0 p-2">
                  <p className="font-semibold text-sm leading-tight">{s.name}</p>
                  <p className="mt-1 text-xs text-muted">Төлөв: <b>{statusLabel(s.status)}</b></p>
                </div>
              ))}
              {!loading && (data?.students || []).length === 0 && (
                <div className="soft-panel soft-panel-muted col-span-4 text-sm text-muted">{'\u042d\u043d\u044d \u0430\u043d\u0433\u0438\u0434 \u0431\u04af\u0440\u0442\u0433\u044d\u043b\u0442\u044d\u0439 \u0441\u0443\u0440\u0430\u0433\u0447 \u0430\u043b\u0433\u0430.'}</div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

