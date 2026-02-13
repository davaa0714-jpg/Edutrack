'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Announcement, Class } from '@/types';
import AppSidebar from '@/app/components/AppSidebar';

type AnnouncementWithClass = Announcement & { classes?: { name: string } | null };

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AnnouncementWithClass[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [classId, setClassId] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');

      const [{ data: annData }, { data: classData }] = await Promise.all([
        supabase
          .from('announcements')
          .select('id, title, body, created_by, target_class_id, created_at, classes(name)')
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('created_at', { ascending: false }),
      ]);
      if (annData) setItems(annData as AnnouncementWithClass[]);
      if (classData) setClasses(classData);
    };
    load();
  }, [router]);

  const createAnnouncement = async () => {
    if (!title) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('announcements').insert({
      title,
      body: body || null,
      created_by: userData.user?.id || null,
      target_class_id: classId ? Number(classId) : null,
    });
    if (error) return alert(error.message);
    setTitle('');
    setBody('');
    setClassId('');
    router.refresh();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">Announcements</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3">
              <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className="input-field" rows={4} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
              <select className="select-field" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-primary" onClick={createAnnouncement}>Publish</button>
            </div>
          </section>

          <div className="mt-6 space-y-3 fade-up delay-2">
            {items.map((a) => (
              <div key={a.id} className="soft-panel soft-panel-muted">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{a.title}</p>
                  <span className="tag">{a.classes?.name || 'All classes'}</span>
                </div>
                {a.body && <p className="text-sm text-muted">{a.body}</p>}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
