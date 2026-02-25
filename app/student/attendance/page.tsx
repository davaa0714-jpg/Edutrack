'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Attendance, Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type AttendanceWithSubject = Attendance & { subjects?: { name: string }[] | null };

const getAttendanceStatusLabel = (status: Attendance['status']) => {
  if (status === 'present') return '\u0418\u0440\u0441\u044d\u043d';
  if (status === 'absent') return '\u0422\u0430\u0441\u0430\u043b\u0441\u0430\u043d';
  if (status === 'late') return '\u0425\u043e\u0446\u043e\u0440\u0441\u043e\u043d';
  if (status === 'sick') return '\u04e8\u0432\u0447\u0442\u044d\u0439';
  if (status === 'excused') return '\u0427\u04e9\u043b\u04e9\u04e9\u0442\u044d\u0439';
  return status;
};

export default function StudentAttendancePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);
  type SubjectOption = Pick<Subject, 'id' | 'name'>;
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<'present' | 'absent' | 'late'>('present');

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'student') return router.replace('/dashboard');

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
        .eq('student_id', userId)
        .order('date', { ascending: false });
      if (attendanceData) setAttendance(attendanceData as AttendanceWithSubject[]);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subjects(id, name)')
        .eq('student_id', userId);
      const list = (enrollments || [])
        .flatMap((e) => (Array.isArray(e.subjects) ? e.subjects : e.subjects ? [e.subjects] : []))
        .filter((s): s is SubjectOption => typeof s.id === 'number' && typeof s.name === 'string');
      setSubjects(list);
    };
    load();
  }, [router]);

  const submitAttendance = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId || !subjectId) return;

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('attendance').insert({
      student_id: userId,
      subject_id: Number(subjectId),
      date: today,
      status,
    });
    if (error) return alert(error.message);
    router.refresh();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('myAttendance')}</h1>

          <section className="soft-panel mt-6 fade-up delay-1">
            <h2 className="text-sm font-semibold">{t('submitAttendance')}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <select className="select-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">{t('selectSubject')}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value as 'present' | 'absent' | 'late')}>
                <option value="present">{getAttendanceStatusLabel('present')}</option>
                <option value="absent">{getAttendanceStatusLabel('absent')}</option>
                <option value="late">{getAttendanceStatusLabel('late')}</option>
              </select>
              <button className="btn-primary" onClick={submitAttendance}>{t('save')}</button>
            </div>
          </section>

          <div className="mt-6 table-shell fade-up delay-2">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('subject')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('status')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{a.subjects?.[0]?.name || t('unknown')}</td>
                    <td className="px-4 py-3">{getAttendanceStatusLabel(a.status)}</td>
                    <td className="px-4 py-3">{a.date}</td>
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


