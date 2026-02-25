'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type ClassSummary = {
  id: number;
  name: string;
  gradeLevel: string | null;
  studentCount: number;
};

export default function TeacherStudentsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ClassSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch('/api/teacher/students/classes', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load classes');
        return;
      }
      setItems((payload.classes || []) as ClassSummary[]);
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
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('roleStudents')}</p>
              <h1 className="mt-2 text-2xl font-semibold">Ангиуд</h1>
            </div>
            <Link href="/teacher/dashboard" className="nav-pill">Dashboard</Link>
          </header>

          <section className="mt-6 grid grid-cols-4 gap-3 fade-up delay-1">
            {items.map((c) => (
              <Link key={c.id} href={`/teacher/students/class/${c.id}`} className="soft-panel block aspect-square min-h-0 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c.name}</p>
                  <span className="tag">{c.studentCount} сурагч</span>
                </div>
                <p className="mt-2 text-sm text-muted">{c.gradeLevel || '-'}</p>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="soft-panel soft-panel-muted col-span-4">
                <p className="text-sm text-muted">Таны хичээлтэй холбогдсон анги алга.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
