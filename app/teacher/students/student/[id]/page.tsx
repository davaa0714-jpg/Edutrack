'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppSidebar from '@/app/components/AppSidebar';

type SubjectRelation = { name: string }[] | { name: string } | null | undefined;

type StudentDetail = {
  student: {
    id: string;
    name: string;
    className: string;
    phone: string | null;
    bio: string | null;
    joinedAt: string;
  };
  stats: {
    attendanceRate: number;
    gradeAverage: number | null;
    records: number;
  };
  recentGrades: Array<{ score: number; created_at: string; subjects?: SubjectRelation }>;
  recentAttendance: Array<{ status: string; date: string; subjects?: SubjectRelation }>;
};

const getName = (value: SubjectRelation) => {
  if (!value) return '-';
  if (Array.isArray(value)) return value[0]?.name || '-';
  return value.name || '-';
};

const getAttendanceStatusLabel = (status: string) => {
  if (status === 'present') return '\u0418\u0440\u0441\u044d\u043d';
  if (status === 'absent') return '\u0422\u0430\u0441\u0430\u043b\u0441\u0430\u043d';
  if (status === 'late') return '\u0425\u043e\u0446\u043e\u0440\u0441\u043e\u043d';
  if (status === 'sick') return '\u04e8\u0432\u0447\u0442\u044d\u0439';
  if (status === 'excused') return '\u0427\u04e9\u043b\u04e9\u04e9\u0442\u044d\u0439';
  return status;
};

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StudentDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      const studentId = params?.id;
      if (!studentId) return router.replace('/teacher/students');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch(`/api/teacher/students/${studentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load student');
        return router.replace('/teacher/students');
      }
      setData(payload as StudentDetail);
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
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Student</p>
              <h1 className="mt-2 text-2xl font-semibold">{data?.student.name || '...'}</h1>
              <p className="mt-2 text-sm text-muted">
                Анги: {data?.student.className || '-'} {data?.student.phone ? ` · ${data.student.phone}` : ''}
              </p>
            </div>
            <Link href="/teacher/students" className="nav-pill">Back</Link>
          </header>

          <section className="mt-6 stat-row fade-up delay-1">
            <div className="stat-card"><p className="text-sm">Ирц: <b>{data?.stats.attendanceRate ?? 0}%</b></p></div>
            <div className="stat-card"><p className="text-sm">Дундаж дүн: <b>{data?.stats.gradeAverage ?? '-'}</b></p></div>
            <div className="stat-card"><p className="text-sm">Ирцийн бичлэг: <b>{data?.stats.records ?? 0}</b></p></div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 fade-up delay-2">
            <div className="soft-panel">
              <p className="text-sm font-semibold">Сүүлийн дүнгүүд</p>
              <div className="mt-3 table-shell">
                <table className="min-w-full text-sm">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3 text-left">Хичээл</th>
                      <th className="px-4 py-3 text-left">Дүн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentGrades || []).map((g, i) => (
                      <tr key={i} className="border-t border-[color:var(--card-border)] zebra">
                        <td className="px-4 py-3">{getName(g.subjects)}</td>
                        <td className="px-4 py-3">{g.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="soft-panel">
              <p className="text-sm font-semibold">Сүүлийн ирцүүд</p>
              <div className="mt-3 table-shell">
                <table className="min-w-full text-sm">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3 text-left">Хичээл</th>
                      <th className="px-4 py-3 text-left">Төлөв</th>
                      <th className="px-4 py-3 text-left">Огноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentAttendance || []).map((a, i) => (
                      <tr key={i} className="border-t border-[color:var(--card-border)] zebra">
                        <td className="px-4 py-3">{getName(a.subjects)}</td>
                        <td className="px-4 py-3">{getAttendanceStatusLabel(a.status)}</td>
                        <td className="px-4 py-3">{a.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
