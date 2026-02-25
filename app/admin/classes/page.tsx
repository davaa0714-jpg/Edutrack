'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Class, Profile } from '@/types';
import AppSidebar from '@/app/components/AppSidebar';

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const getTeacherName = (id: string | null) => {
    if (!id) return '-';
    return teachers.find((t) => t.id === id)?.full_name || '-';
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');

      const [{ data: classData }, { data: teacherData }] = await Promise.all([
        supabase.from('classes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'teacher'),
      ]);
      if (classData) setClasses(classData);
      if (teacherData) setTeachers(teacherData);
    };
    load();
  }, [router]);

  const createClass = async () => {
    if (!name) return;
    const { error } = await supabase.from('classes').insert({
      name,
      grade_level: gradeLevel || null,
      homeroom_teacher_id: teacherId || null,
    });
    if (error) return alert(error.message);
    setName('');
    setGradeLevel('');
    setTeacherId('');
    router.refresh();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">Classes</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3 md:grid-cols-4">
              <input className="input-field" placeholder="Class name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input-field" placeholder="Grade level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
              <select className="select-field" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Homeroom teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.phone || 'Teacher'}</option>)}
              </select>
              <button className="btn-primary" onClick={createClass}>Create class</button>
            </div>
          </section>

          <div className="mt-6 table-shell fade-up delay-2">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">Homeroom teacher</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.grade_level || '-'}</td>
                    <td className="px-4 py-3">{getTeacherName(c.homeroom_teacher_id)}</td>
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
