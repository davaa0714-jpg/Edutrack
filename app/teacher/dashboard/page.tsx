'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';
import ToggleGroup from '@/app/components/ToggleGroup';

export default function TeacherDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState(0);
  const [subjects, setSubjects] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profileData) return;
      setProfile(profileData);
      if (profileData.role === 'student') return router.replace('/student/dashboard');
      if (profileData.role === 'admin') return router.replace('/admin/dashboard');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;

      const res = await fetch('/api/teacher/dashboard', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setStudents(Number(payload.studentCount) || 0);
        setSubjects(Number(payload.subjectCount) || 0);
      }
    };
    load();
  }, [router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('teacherDashboard')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{profile?.full_name || t('roleTeachers')}</h1>
            </div>
            <ToggleGroup />
          </header>

          <section className="mt-6 stat-row fade-up delay-1">
            <div className="stat-card"><p className="text-sm">{t('subjects')}: <b>{subjects}</b></p></div>
            <Link href="/teacher/students" className="stat-card"><p className="text-sm">{t('roleStudents')}: <b>{students}</b></p></Link>
            <Link href="/teacher/attendance" className="stat-card"><p className="text-sm">{t('enterAttendance')}</p></Link>
            <Link href="/teacher/grades" className="stat-card"><p className="text-sm">{t('enterGrade')}</p></Link>
          </section>
        </main>
      </div>
    </div>
  );
}
