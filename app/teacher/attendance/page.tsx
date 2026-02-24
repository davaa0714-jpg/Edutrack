'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Attendance, Profile, Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type AttendanceWithSubject = Attendance & { subjects?: { name: string }[] | null };

export default function TeacherAttendancePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [students, setStudents] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'present' | 'absent' | 'late'>('present');

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'teacher') return router.replace('/dashboard');

      const { data: studentsData } = await supabase.from('profiles').select('*').eq('role', 'student');
      if (studentsData) setStudents(studentsData);

      const { data: subjectsData } = await supabase.from('subjects').select('*').eq('teacher_id', userId);
      if (subjectsData) setSubjects(subjectsData);

      const subjectIds = (subjectsData || []).map((s) => s.id);
      if (subjectIds.length > 0) {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
          .in('subject_id', subjectIds)
          .order('date', { ascending: false });
        if (attendanceData) setAttendance(attendanceData as AttendanceWithSubject[]);
      }
    };
    load();
  }, [router]);

  const submitAttendance = async () => {
    if (!studentId || !subjectId || !date) return;
    const { error } = await supabase.from('attendance').insert({
      student_id: studentId,
      subject_id: Number(subjectId),
      date,
      status,
    });
    if (error) return alert(error.message);
    router.refresh();
  };

  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.full_name || s.id])), [students]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('enterAttendance')}</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3 md:grid-cols-4">
              <select className="select-field" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">{t('selectStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.id}</option>)}
              </select>
              <select className="select-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">{t('selectSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value as 'present' | 'absent' | 'late')}>
                <option value="present">{t('present')}</option>
                <option value="absent">{t('absent')}</option>
                <option value="late">{t('late')}</option>
              </select>
            </div>
            <button className="btn-primary mt-4" onClick={submitAttendance}>{t('save')}</button>
          </section>

          <div className="mt-6 table-shell fade-up delay-2">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('fullName')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('subject')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('status')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{studentMap[a.student_id] || a.student_id}</td>
                    <td className="px-4 py-3">{a.subjects?.[0]?.name || t('unknown')}</td>
                    <td className="px-4 py-3">{a.status}</td>
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

