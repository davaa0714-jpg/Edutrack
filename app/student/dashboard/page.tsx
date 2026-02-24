'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Announcement, Attendance, Grade, Profile } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';
import ToggleGroup from '@/app/components/ToggleGroup';

type GradeWithSubject = Grade & { subjects?: { name: string }[] | null };
type AttendanceWithSubject = Attendance & { subjects?: { name: string }[] | null };
type AnnouncementWithMeta = Announcement & {
  classes?: { name: string }[] | null;
  profiles?: { full_name: string }[] | null;
};

export default function StudentDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [grades, setGrades] = useState<GradeWithSubject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithSubject[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithMeta[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        router.replace('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profileData) return;
      setProfile(profileData);

      if (profileData.role === 'teacher') {
        router.replace('/teacher/dashboard');
        return;
      }
      if (profileData.role === 'admin') {
        router.replace('/admin/dashboard');
        return;
      }

      const { data: gradesData } = await supabase
        .from('grades')
        .select('id, score, subject_id, student_id, created_at, subjects(name)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (gradesData) setGrades(gradesData as GradeWithSubject[]);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, date, status, student_id, subject_id, created_at, subjects(name)')
        .eq('student_id', userId)
        .order('date', { ascending: false })
        .limit(8);
      if (attendanceData) setAttendance(attendanceData as AttendanceWithSubject[]);

      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', userId);
      const classIds = (memberships || []).map((m) => m.class_id);

      let announcementQuery = supabase
        .from('announcements')
        .select('id, title, body, created_at, created_by, target_class_id, classes(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);

      if (classIds.length > 0) {
        const inClause = classIds.join(',');
        announcementQuery = announcementQuery.or(`target_class_id.is.null,target_class_id.in.(${inClause})`);
      } else {
        announcementQuery = announcementQuery.is('target_class_id', null);
      }

      const { data: announcementData } = await announcementQuery;
      if (announcementData) setAnnouncements(announcementData as AnnouncementWithMeta[]);
    };
    load();
  }, [router]);

  const avg = useMemo(() => {
    if (grades.length === 0) return '--';
    return (grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length).toFixed(1);
  }, [grades]);

  const presentRate = useMemo(() => {
    if (attendance.length === 0) return '--';
    const present = attendance.filter((a) => a.status === 'present').length;
    return `${Math.round((present / attendance.length) * 100)}%`;
  }, [attendance]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('studentDashboard')}</p>
              <h1 className="mt-2 text-2xl font-semibold">{profile?.full_name || t('roleStudents')}</h1>
            </div>
            <ToggleGroup />
          </header>

          <section className="mt-6 stat-row fade-up delay-1">
            <div className="stat-card"><p className="text-sm">{t('averageScore')}: <b>{avg}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('attendanceRate')}: <b>{presentRate}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('grades')}: <b>{grades.length}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('attendance')}: <b>{attendance.length}</b></p></div>
          </section>

          <section className="mt-6 soft-panel fade-up delay-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Medee medeelel</h2>
              <span className="tag">{announcements.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="soft-panel soft-panel-muted px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{a.title}</p>
                    <span className="tag">{a.classes?.[0]?.name || 'Buh angi'}</span>
                  </div>
                  {a.body && <p className="mt-2 text-xs text-muted">{a.body}</p>}
                  <p className="mt-2 text-[11px] text-muted">
                    {a.profiles?.[0]?.full_name || 'Admin'} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="soft-panel soft-panel-muted px-4 py-6 text-sm text-muted">
                  Medeelel baihgui baina.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

