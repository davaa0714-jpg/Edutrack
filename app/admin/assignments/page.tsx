'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Assignment, Subject } from '@/types';
import AppSidebar from '@/app/components/AppSidebar';

type AssignmentWithSubject = Assignment & { subjects?: { name: string } | null };

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssignmentWithSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');

      const [{ data: assignmentData }, { data: subjectData }] = await Promise.all([
        supabase
          .from('assignments')
          .select('id, title, description, due_date, subject_id, created_at, subjects(name)')
          .order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('created_at', { ascending: false }),
      ]);
      if (assignmentData) setItems(assignmentData as AssignmentWithSubject[]);
      if (subjectData) setSubjects(subjectData);
    };
    load();
  }, [router]);

  const createAssignment = async () => {
    if (!title || !subjectId) return;
    const { error } = await supabase.from('assignments').insert({
      title,
      description: description || null,
      due_date: dueDate || null,
      subject_id: Number(subjectId),
    });
    if (error) return alert(error.message);
    setTitle('');
    setDescription('');
    setDueDate('');
    setSubjectId('');
    router.refresh();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">Assignments</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3">
              <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className="input-field" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <select className="select-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">Subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={createAssignment}>Create assignment</button>
            </div>
          </section>

          <div className="mt-6 space-y-3 fade-up delay-2">
            {items.map((a) => (
              <div key={a.id} className="soft-panel soft-panel-muted">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{a.title}</p>
                  <span className="tag">{a.subjects?.name || '-'}</span>
                </div>
                <p className="text-sm text-muted">Due: {a.due_date || 'TBD'}</p>
                {a.description && <p className="text-sm text-muted">{a.description}</p>}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
