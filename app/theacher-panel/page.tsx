'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Subject, Enrollment, Attendance, Grade } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

interface AttendanceWithSubject extends Attendance {
  subjects: { name: string }[];
}

interface GradeWithSubject extends Grade {
  subjects: { name: string }[];
}

export default function TeacherPanel() {
  const { t } = useI18n();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: userData } = await supabase.auth.getUser();
      const teacherId = userData?.user?.id;
      if (!teacherId) return;

      // Энэ багшийн хичээлүүд
      const { data: subs } = await supabase.from('subjects').select('*').eq('teacher_id', teacherId);
      if (subs) setSubjects(subs);
    }
    fetchData();
  }, []);

  // Сонгогдсон хичээлийн оюутнууд
  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);

    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('*')
      .eq('subject_id', subject.id);
    if (enrolls) setEnrollments(enrolls);

    const { data: gradesData } = await supabase
      .from('grades')
      .select('id, score, student_id, subject_id, created_at, subjects(name)')
      .eq('subject_id', subject.id);
    if (gradesData) setGrades(gradesData as GradeWithSubject[]);

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
      .eq('subject_id', subject.id);
    if (attendanceData) setAttendance(attendanceData as AttendanceWithSubject[]);
  };

  const handleGradeChange = async (studentId: string, score: number) => {
    if (!selectedSubject) return;

    const { data: existing } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject_id', selectedSubject.id)
      .single();

    if (existing) {
      await supabase.from('grades').update({ score }).eq('id', existing.id);
    } else {
      await supabase.from('grades').insert({ student_id: studentId, subject_id: selectedSubject.id, score });
    }

    handleSelectSubject(selectedSubject); // Refresh
  };

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!selectedSubject) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject_id', selectedSubject.id)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({ student_id: studentId, subject_id: selectedSubject.id, status });
    }

    handleSelectSubject(selectedSubject); // Refresh
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />

        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('teacherWorkspace')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('manageClasses')}</h1>
              <p className="mt-2 text-sm text-muted">{t('selectSubject')}</p>
            </div>
            <div className="flex items-center gap-3">
              <ToggleGroup />
              <span className="tag">{subjects.length} {t('subjects')}</span>
            </div>
          </header>

          <section className="mt-6 soft-panel fade-up delay-1">
            <label className="form-label">{t('selectSubjectTitle')}</label>
            <select
              className="select-field mt-3 md:max-w-md"
              onChange={(e) => handleSelectSubject(subjects.find((s) => s.id === Number(e.target.value))!)}
            >
              <option value="">-- {t('selectSubject')} --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </section>

          {selectedSubject && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2 fade-up delay-2">
              <section className="soft-panel">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{t('enrollmentsGrades')}</h2>
                  <span className="tag">{selectedSubject.name}</span>
                </div>
                <div className="mt-4 table-shell">
                  <table className="min-w-full text-sm">
                    <thead className="table-head">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">{t('studentId')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('score')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => {
                        const studentGrade = grades.find((g) => g.student_id === e.student_id);
                        return (
                          <tr key={e.id} className="border-t border-[color:var(--card-border)] zebra">
                            <td className="px-4 py-3 text-muted">{e.student_id}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={studentGrade?.score || ''}
                                className="input-field w-24 px-3 py-2 text-sm"
                                onChange={(ev) => handleGradeChange(e.student_id, Number(ev.target.value))}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleGradeChange(e.student_id, studentGrade?.score || 0)}
                                className="btn-primary px-3 py-2 text-[11px]"
                              >
                                {t('save')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {enrollments.length === 0 && (
                        <tr className="border-t border-[color:var(--card-border)]">
                          <td className="px-4 py-6 text-sm text-muted" colSpan={3}>
                            {t('noEnrollments')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="soft-panel">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{t('attendance')}</h2>
                  <span className="tag">{t('today')}</span>
                </div>
                <div className="mt-4 table-shell">
                  <table className="min-w-full text-sm">
                    <thead className="table-head">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">{t('studentId')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => {
                        const studentAttendance = attendance.find((a) => a.student_id === e.student_id);
                        return (
                          <tr key={e.id} className="border-t border-[color:var(--card-border)] zebra">
                            <td className="px-4 py-3 text-muted">{e.student_id}</td>
                            <td className="px-4 py-3">
                              <select
                                value={studentAttendance?.status || 'present'}
                                onChange={(ev) => handleAttendanceChange(e.student_id, ev.target.value as 'present' | 'absent' | 'late')}
                                className="select-field w-28 px-3 py-2 text-sm"
                              >
                                <option value="present">{t('present')}</option>
                                <option value="absent">{t('absent')}</option>
                                <option value="late">{t('late')}</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {enrollments.length === 0 && (
                        <tr className="border-t border-[color:var(--card-border)]">
                          <td className="px-4 py-6 text-sm text-muted" colSpan={2}>
                            {t('noAttendance')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
