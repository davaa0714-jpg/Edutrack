'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

export default function AdminUsersPage() {
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

  const updateField = async (id: string, full_name: string, phone: string | null) => {
    const { error } = await supabase.from('profiles').update({ full_name, phone }).eq('id', id);
    if (error) alert(error.message);
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('users')}</h1>
          <div className="mt-6 table-shell fade-up delay-1">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left">{t('id')}</th>
                  <th className="px-4 py-3 text-left">{t('fullName')}</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">{t('role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[color:var(--card-border)] zebra">
                    <td className="px-4 py-3 text-xs">{u.id}</td>
                    <td className="px-4 py-3">
                      <input
                        className="input-field"
                        defaultValue={u.full_name || ''}
                        onBlur={(e) => updateField(u.id, e.target.value, u.phone || null)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="input-field"
                        defaultValue={u.phone || ''}
                        onBlur={(e) => updateField(u.id, u.full_name || '', e.target.value || null)}
                      />
                    </td>
                    <td className="px-4 py-3">{u.role}</td>
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
