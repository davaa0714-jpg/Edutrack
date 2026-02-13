'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Attendance, Grade, Profile } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';
import jsPDF from 'jspdf';

interface GradeWithSubject extends Grade { subjects: { name: string }[]; }
interface AttendanceWithSubject extends Attendance { subjects: { name: string }[]; }

export default function ReportsPage() {
  const { t } = useI18n();
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) setProfile(profileData as Profile);
      const { data: gradesData } = await supabase
        .from('grades')
        .select('id, score, subject_id, student_id, created_at, subjects(name)')
        .eq('student_id', userId);
      if (gradesData) setGrades(gradesData as GradeWithSubject[]);
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
        .eq('student_id', userId);
      if (attendanceData) setAttendance(attendanceData as AttendanceWithSubject[]);
    };
    load();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`${t('reportFor')}${profile?.full_name || ''}`, 10, 10);
    doc.text(`${t('gradesLabel')}:`, 10, 20);
    grades.forEach((g, i) => {
      doc.text(`${g.subjects[0]?.name || t('unknown')}: ${g.score}`, 10, 30 + i * 10);
    });
    doc.text(`${t('attendanceLabel')}:`, 10, 40 + grades.length * 10);
    attendance.forEach((a, i) => {
      doc.text(`${a.subjects[0]?.name || t('unknown')} - ${a.date}: ${a.status}`, 10, 50 + grades.length * 10 + i * 10);
    });
    doc.save('report.pdf');
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('reports')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{t('reports')}</h1>
              <p className="mt-2 text-sm text-muted">{t('downloadReport')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] fade-up delay-1">
            <div className="soft-panel">
              <h2 className="text-sm font-semibold">{t('summary')}</h2>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="tag">{grades.length} {t('grades')}</span>
                  <span className="tag">{attendance.length} {t('attendance')}</span>
                </div>
                <button onClick={generatePDF} className="btn-primary">
                  {t('downloadReport')}
                </button>
              </div>
            </div>
            <div className="soft-panel">
              <h2 className="text-sm font-semibold">{t('todayHighlights')}</h2>
              <p className="mt-2 text-sm text-muted">{t('homeSubtitle')}</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
