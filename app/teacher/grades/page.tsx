'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Grade, Profile, Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type GradeWithSubject = Grade & { subjects?: { name: string } | null };

export default function TeacherGradesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [students, setStudents] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [score, setScore] = useState('');

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
        const { data: gradeData } = await supabase
          .from('grades')
          .select('id, score, subject_id, student_id, created_at, subjects(name)')
          .in('subject_id', subjectIds)
          .order('created_at', { ascending: false });
        if (gradeData) setGrades(gradeData as GradeWithSubject[]);
      }
    };
    load();
  }, [router]);

  const submitGrade = async () => {
    if (!studentId || !subjectId || !score) return;
    const value = Number(score);
    if (Number.isNaN(value) || value < 0 || value > 100) return alert('Score must be 0-100');
    const { error } = await supabase.from('grades').insert({
      student_id: studentId,
      subject_id: Number(subjectId),
      score: value,
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
          <h1 className="text-2xl font-semibold fade-up">{t('enterGrade')}</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3 md:grid-cols-3">
              <select className="select-field" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">{t('selectStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.id}</option>)}
              </select>
              <select className="select-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">{t('selectSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="input-field" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <button className="btn-primary mt-4" onClick={submitGrade}>{t('save')}</button>
          </section>

          <div className="mt-6 table-shell fade-up delay-2">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('fullName')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('subject')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('score')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{studentMap[g.student_id] || g.student_id}</td>
                    <td className="px-4 py-3">{g.subjects?.name || t('unknown')}</td>
                    <td className="px-4 py-3">{g.score}</td>
                    <td className="px-4 py-3">{new Date(g.created_at).toLocaleDateString()}</td>
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
