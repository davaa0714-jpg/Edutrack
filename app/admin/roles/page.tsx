'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, Role } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

export default function AdminRolesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    };
    load();
  }, [router]);

  const updateRole = async (id: string, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return alert(error.message);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('manageRoles')}</h1>
          <div className="mt-6 table-shell fade-up delay-1">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left">{t('fullName')}</th>
                  <th className="px-4 py-3 text-left">{t('email')}</th>
                  <th className="px-4 py-3 text-left">{t('role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3">{u.full_name || '-'}</td>
                    <td className="px-4 py-3 text-xs">{u.id}</td>
                    <td className="px-4 py-3">
                      <select className="select-field" value={u.role} onChange={(e) => updateRole(u.id, e.target.value as Role)}>
                        <option value="student">{t('roleStudents')}</option>
                        <option value="teacher">{t('roleTeachers')}</option>
                        <option value="admin">{t('roleAdmins')}</option>
                      </select>
                    </td>
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
