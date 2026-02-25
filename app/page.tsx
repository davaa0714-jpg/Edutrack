'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import { supabase } from '@/lib/supabase';

type AnnouncementItem = {
  id: number;
  title: string;
  created_at: string;
  classes?: { name: string }[] | null;
};

type HomeMetrics = {
  users: number | null;
  students: number | null;
  teachers: number | null;
  admins: number | null;
  classes: number | null;
  subjects: number | null;
  averageScore: number | null;
  attendanceRate: number | null;
};

export default function Home() {
  const { t, language } = useI18n();
  const isMn = language === 'mn';
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HomeMetrics>({
    users: null,
    students: null,
    teachers: null,
    admins: null,
    classes: null,
    subjects: null,
    averageScore: null,
    attendanceRate: null,
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceIso = since.toISOString();
        const sinceDate = sinceIso.slice(0, 10);

        const [
          totalUsersRes,
          studentsRes,
          teachersRes,
          adminsRes,
          classesRes,
          subjectsRes,
          gradesRes,
          attendanceRes,
          announcementsRes,
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('grades').select('score, created_at').gte('created_at', sinceIso).limit(500),
          supabase.from('attendance').select('status, date').gte('date', sinceDate).limit(500),
          supabase
            .from('announcements')
            .select('id, title, created_at, classes(name)')
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        const gradeRows = (gradesRes.data || []).filter((g) => typeof g.score === 'number');
        const averageScore = gradeRows.length
          ? gradeRows.reduce((sum, row) => sum + row.score, 0) / gradeRows.length
          : null;

        const attendanceRows = attendanceRes.data || [];
        const presentCount = attendanceRows.filter((row) => row.status === 'present').length;
        const attendanceRate = attendanceRows.length ? (presentCount / attendanceRows.length) * 100 : null;

        setMetrics({
          users: totalUsersRes.count ?? null,
          students: studentsRes.count ?? null,
          teachers: teachersRes.count ?? null,
          admins: adminsRes.count ?? null,
          classes: classesRes.count ?? null,
          subjects: subjectsRes.count ?? null,
          averageScore,
          attendanceRate,
        });

        setAnnouncements((announcementsRes.data as AnnouncementItem[] | null) || []);
      } catch (error) {
        console.error('Homepage data load failed:', error);
        setMetrics({
          users: null,
          students: null,
          teachers: null,
          admins: null,
          classes: null,
          subjects: null,
          averageScore: null,
          attendanceRate: null,
        });
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: isMn ? 'Нийт хэрэглэгч' : 'Total users',
        value: metrics.users ?? '--',
        note: isMn ? 'Системд бүртгэлтэй' : 'Registered',
      },
      {
        label: t('averageScore'),
        value: metrics.averageScore == null ? '--' : `${metrics.averageScore.toFixed(1)}%`,
        note: t('last30Days'),
      },
      {
        label: t('attendanceRate'),
        value: metrics.attendanceRate == null ? '--' : `${Math.round(metrics.attendanceRate)}%`,
        note: t('last30Days'),
      },
      {
        label: isMn ? 'Анги / Хичээл' : 'Classes / Subjects',
        value: metrics.classes == null || metrics.subjects == null ? '--' : `${metrics.classes} / ${metrics.subjects}`,
        note: isMn ? 'Одоогийн бүтэц' : 'Current structure',
      },
    ],
    [isMn, metrics, t]
  );

  const roleStats = [
    { label: t('roleStudents'), value: metrics.students },
    { label: t('roleTeachers'), value: metrics.teachers },
    { label: t('roleAdmins'), value: metrics.admins },
  ];

  return (
    <div className="min-h-screen app-bg">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <header className="flex flex-col gap-4 fade-up md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{t('appName')}</span>
            <span className="chip">{t('today')}</span>
            <span className="chip">{loading ? 'Loading' : t('live')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup />
            <Link href="/login" className="btn-secondary">{t('login')}</Link>
            <Link href="/register" className="btn-primary">{t('register')}</Link>
          </div>
        </header>

        <section className="mt-6 fade-up delay-1">
          <h1 className="text-2xl font-semibold md:text-3xl">
            {isMn ? 'Нүүр хуудас' : 'Compact square-card homepage'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isMn ? 'Картууд хажуу тийш дараалж, утсан дээр swipe хийж үзэхээр хийсэн.' : 'Cards are arranged horizontally with swipe support on mobile.'}
          </p>
        </section>

        <section className="mt-6 fade-up delay-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{isMn ? 'Гол Үзүүлэлт' : 'Core metrics'}</h2>
            <span className="text-xs text-muted">{loading ? '...' : t('live')}</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {stats.map((stat) => (
              <div key={stat.label} className="soft-panel min-w-[170px] aspect-square shrink-0 rounded-xl p-4 justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 fade-up delay-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{isMn ? 'Хэрэглэгчийн бүтэц' : 'Role distribution'}</h2>
            <span className="tag">{metrics.users ?? '--'}</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {roleStats.map((item) => (
              <div key={item.label} className="soft-panel min-w-[150px] aspect-square shrink-0 rounded-xl p-4 justify-between">
                <p className="text-xs text-muted">{item.label}</p>
                <p className="text-3xl font-semibold">{item.value ?? '--'}</p>
                <p className="text-xs text-muted">{isMn ? 'Бүртгэл' : 'Count'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 fade-up delay-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{isMn ? 'Сүүлийн мэдээ' : 'Latest announcements'}</h2>
            <span className="tag">{announcements.length}</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {announcements.map((item) => (
              <div key={item.id} className="soft-panel min-w-[220px] aspect-square shrink-0 rounded-xl p-4 justify-between">
                <p className="text-sm font-semibold">{item.title}</p>
                <div>
                  <p className="text-xs text-muted">{item.classes?.[0]?.name || (isMn ? 'Бүх анги' : 'All classes')}</p>
                  <p className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="soft-panel min-w-[220px] aspect-square shrink-0 rounded-xl p-4 justify-center">
                <p className="text-xs text-muted">{isMn ? 'Мэдээ алга.' : 'No announcements.'}</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 pb-8 fade-up delay-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{isMn ? 'Шуурхай нэвтрэх' : 'Quick access'}</h2>
            <span className="text-xs text-muted">{isMn ? 'Хажуу тийш гүйлгэнэ' : 'Horizontal row'}</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            <Link href="/student/dashboard" className="soft-panel min-w-[150px] aspect-square shrink-0 rounded-xl p-4 justify-center text-center">{isMn ? 'Сурагч' : 'Student'}</Link>
            <Link href="/teacher/dashboard" className="soft-panel min-w-[150px] aspect-square shrink-0 rounded-xl p-4 justify-center text-center">{isMn ? 'Багш' : 'Teacher'}</Link>
            <Link href="/admin/dashboard" className="soft-panel min-w-[150px] aspect-square shrink-0 rounded-xl p-4 justify-center text-center">{isMn ? 'Админ' : 'Admin'}</Link>
            <Link href="/reports" className="soft-panel min-w-[150px] aspect-square shrink-0 rounded-xl p-4 justify-center text-center">{t('reports')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

