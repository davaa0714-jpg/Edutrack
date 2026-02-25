'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';
import ToggleGroup from '@/app/components/ToggleGroup';

type SubjectDetail = {
  subject: { id: number; name: string };
  teacher: { id: string; name: string; phone: string | null };
  classStats: Array<{
    classId: number;
    className: string;
    slots: string[];
    students: number;
    present: number;
    absent: number;
    sick: number;
    excused: number;
    late: number;
    total: number;
    presentRate: number;
  }>;
};

const dayLabel = (value: number) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[Math.max(0, Math.min(6, (value || 1) - 1))];
};

const formatSlot = (raw: string) => {
  const [day, rest] = raw.split(' ');
  const dayNum = Number(day);
  const prefix = Number.isNaN(dayNum) ? day : dayLabel(dayNum);
  return `${prefix} ${rest || ''}`.trim();
};

export default function SubjectDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const subjectId = Number(params?.id);
      if (!subjectId) return router.replace('/subjects');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch(`/api/teacher/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load subject details');
        return router.replace('/subjects');
      }
      setData(payload as SubjectDetail);
      setLoading(false);
    };
    load();
  }, [params?.id, router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('subjects')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{data?.subject.name || '...'}</h1>
              <p className="mt-2 text-sm text-muted">
                {loading ? 'Loading...' : `${'\u0411\u0430\u0433\u0448'}: ${data?.teacher.name || '-'}`}
                {data?.teacher.phone ? ` · ${data.teacher.phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
              <Link href="/subjects" className="nav-pill">{t('subjects')}</Link>
            </div>
          </header>

          <section className="mt-6 grid grid-cols-4 gap-3 fade-up delay-1">
            {(data?.classStats || []).map((item) => (
              <div key={item.classId} className="soft-panel aspect-square min-h-0 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.className}</p>
                  <span className="tag">{item.students} {'\u0441\u0443\u0440\u0430\u0433\u0447'}</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {item.slots.length > 0 ? item.slots.map((s) => formatSlot(s)).join(' · ') : '\u0425\u0443\u0432\u0430\u0430\u0440\u044c\u0433\u04af\u0439'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p>{'\u0418\u0440\u0441\u044d\u043d'}: <b>{item.present}</b></p>
                  <p>{'\u0422\u0430\u0441\u0430\u043b\u0441\u0430\u043d'}: <b>{item.absent}</b></p>
                  <p>{'\u04e8\u0432\u0447\u0442\u04e9\u0439'}: <b>{item.sick}</b></p>
                  <p>{'\u0427\u04e9\u043b\u04e9\u04e9\u0442\u044d\u0439'}: <b>{item.excused}</b></p>
                </div>
                <p className="mt-3 text-sm text-muted">{'\u0418\u0440\u0446'}: <b>{item.presentRate}%</b> ({item.total} {'\u0431\u0438\u0447\u043b\u044d\u0433'})</p>
              </div>
            ))}
            {!loading && (data?.classStats || []).length === 0 && (
              <div className="soft-panel soft-panel-muted col-span-4">
                <p className="text-sm text-muted">{'\u042d\u043d\u044d \u0445\u0438\u0447\u044d\u044d\u043b\u0434 \u0445\u043e\u043b\u0431\u043e\u0433\u0434\u0441\u043e\u043d \u0430\u043d\u0433\u0438 \u0430\u043b\u0433\u0430.'}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
