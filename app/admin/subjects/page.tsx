'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

export default function AdminSubjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const getTeacherName = (id: string | null) => {
    if (!id) return '-';
    return teachers.find((tch) => tch.id === id)?.full_name || '-';
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');

      const [{ data: subjectData }, { data: teacherData }] = await Promise.all([
        supabase.from('subjects').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'teacher'),
      ]);
      if (subjectData) setSubjects(subjectData);
      if (teacherData) setTeachers(teacherData);
    };
    load();
  }, [router]);

  const createSubject = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return alert('Unauthorized');

    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: trimmedName, teacherId: teacherId || null }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return alert(payload.error || 'Failed to create subject');

    if (payload.subject) {
      setSubjects((prev) => [payload.subject as Subject, ...prev]);
    }
    setName('');
    setTeacherId('');
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('subjects')}</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input-field" placeholder="Subject name" value={name} onChange={(e) => setName(e.target.value)} />
              <select className="select-field" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">{t('roleTeachers')}</option>
                {teachers.map((tch) => (
                  <option key={tch.id} value={tch.id}>{tch.full_name || tch.phone || 'Teacher'}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={createSubject}>{t('save')}</button>
            </div>
          </section>

          <div className="mt-6 table-shell fade-up delay-2">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left">{t('subject')}</th>
                  <th className="px-4 py-3 text-left">{t('roleTeachers')}</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{getTeacherName(s.teacher_id || null)}</td>
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
