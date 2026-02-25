'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppSidebar from '@/app/components/AppSidebar';

type ClassDetail = {
  class: { id: number; name: string; gradeLevel: string | null };
  students: Array<{ id: string; name: string }>;
  studentCount: number;
};

export default function TeacherClassStudentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ClassDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      const classId = Number(params?.id);
      if (!classId) return router.replace('/teacher/students');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return router.replace('/login');

      const res = await fetch(`/api/teacher/students/classes/${classId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error || 'Failed to load class');
        return router.replace('/teacher/students');
      }
      setData(payload as ClassDetail);
    };
    load();
  }, [params?.id, router]);

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Class</p>
              <h1 className="mt-2 text-2xl font-semibold">{data?.class.name || '...'}</h1>
              <p className="mt-2 text-sm text-muted">{data?.studentCount || 0} сурагч</p>
            </div>
            <Link href="/teacher/students" className="nav-pill">Back</Link>
          </header>

          <section className="mt-6 soft-panel fade-up delay-1">
            <div className="grid grid-cols-4 gap-3">
              {(data?.students || []).map((s, idx) => (
                <Link
                  key={s.id}
                  href={`/teacher/students/student/${s.id}`}
                  className="soft-panel soft-panel-muted block aspect-square min-h-0 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs text-muted">#{idx + 1}</p>
                  <p className="mt-2 text-sm font-semibold leading-tight">{s.name}</p>
                </Link>
              ))}
              {(data?.students || []).length === 0 && (
                <div className="soft-panel soft-panel-muted col-span-4 text-sm text-muted">Энэ ангид сурагч алга.</div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
