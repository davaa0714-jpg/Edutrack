'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, Role } from '@/types';
import AppSidebar from '@/app/components/AppSidebar';
import ToggleGroup from '@/app/components/ToggleGroup';
import { useI18n } from '@/lib/i18n';
import { Icon } from '@/app/components/Icons';

export default function AdminDashboardPage() {
  const { t, language } = useI18n();
  const isMn = language === 'mn';
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const adminMenu = useMemo(
    () => [
      { href: '/admin/dashboard', label: t('dashboard') },
      { href: '/admin/users', label: t('users') },
      { href: '/admin/roles', label: t('manageRoles') },
      { href: '/admin/classes', label: isMn ? 'Анги' : 'Classes' },
      { href: '/admin/subjects', label: t('subjects') },
      { href: '/admin/announcements', label: isMn ? 'Мэдээ' : 'Announcements' },
      { href: '/admin/assignments', label: isMn ? 'Даалгавар' : 'Assignments' },
      { href: '/admin/schedule', label: t('schedule') },
    ],
    [isMn, t]
  );

  const fetchData = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      setCurrentUserId(userId);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') {
        if (profile?.role === 'teacher') return router.replace('/teacher/dashboard');
        return router.replace('/student/dashboard');
      }
      fetchData();
    };
    init();
  }, [router]);

  const stats = useMemo(() => {
    const studentCount = users.filter((u) => u.role === 'student').length;
    const teacherCount = users.filter((u) => u.role === 'teacher').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    return { studentCount, teacherCount, adminCount, total: users.length };
  }, [users]);

  const updateRole = async (id: string, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return alert(error.message);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const updateField = async (id: string, payload: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(payload).eq('id', id);
    if (error) alert(error.message);
  };

  const deleteUser = async (id: string) => {
    if (id === currentUserId) return alert(isMn ? 'Өөрийгөө устгах боломжгүй' : 'Cannot delete yourself');
    if (!window.confirm(isMn ? 'Энэ хэрэглэгчийг бүрэн устгах уу?' : 'Delete this user completely?')) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return alert(isMn ? 'Session олдсонгүй' : 'Session not found');

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: id }),
    });
    const payload = await res.json();
    if (!res.ok) return alert(payload?.error || (isMn ? 'Устгаж чадсангүй' : 'Delete failed'));
    fetchData();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('adminConsole')}</p>
              <h1 className="mt-2 text-2xl font-semibold">
                {isMn ? 'Хэрэглэгчийн мэдээлэл ба эрхийн удирдлага' : 'User details & role management'}
              </h1>
            </div>
            <ToggleGroup />
          </header>

          <section className="mt-4 flex flex-wrap gap-2 fade-up delay-1">
            {adminMenu.map((m) => (
              <Link key={m.href} href={m.href} className={`nav-pill ${m.href === '/admin/dashboard' ? 'active' : ''}`}>
                {m.label}
              </Link>
            ))}
          </section>

          <section className="mt-6 stat-row fade-up delay-1">
            <div className="stat-card"><p className="text-sm">{isMn ? 'Нийт хэрэглэгч' : 'All users'}: <b>{stats.total}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('roleStudents')}: <b>{stats.studentCount}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('roleTeachers')}: <b>{stats.teacherCount}</b></p></div>
            <div className="stat-card"><p className="text-sm">{t('roleAdmins')}: <b>{stats.adminCount}</b></p></div>
          </section>

          <section className="mt-6 soft-panel fade-up delay-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{isMn ? 'Хэрэглэгчийн дэлгэрэнгүй' : 'Detailed users'}</h2>
              <span className="tag">{users.length}</span>
            </div>
            <div className="mt-4 table-shell">
              <table className="min-w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('fullName')}</th>
                    <th className="px-4 py-3 text-left">{isMn ? 'Утас' : 'Phone'}</th>
                    <th className="px-4 py-3 text-left">{t('role')}</th>
                    <th className="px-4 py-3 text-left">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[color:var(--card-border)] zebra">
                      <td className="px-4 py-3">
                        <input
                          className="input-field"
                          defaultValue={u.full_name || ''}
                          onBlur={(e) => updateField(u.id, { full_name: e.target.value || null })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="input-field"
                          defaultValue={u.phone || ''}
                          onBlur={(e) => updateField(u.id, { phone: e.target.value || null })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="select-field"
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value as Role)}
                        >
                          <option value="student">{t('roleStudents')}</option>
                          <option value="teacher">{t('roleTeachers')}</option>
                          <option value="admin">{t('roleAdmins')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex h-9 w-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0 text-red-600 shadow-none outline-none hover:bg-red-50 focus:outline-none"
                          disabled={u.id === currentUserId}
                          aria-label={isMn ? 'Устгах' : 'Delete'}
                          title={isMn ? 'Устгах' : 'Delete'}
                        >
                          <Icon.Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
