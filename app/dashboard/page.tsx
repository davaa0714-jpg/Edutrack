'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectByRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
        return;
      }

      if (profile?.role === 'teacher') {
        router.replace('/teacher/dashboard');
        return;
      }

      router.replace('/student/dashboard');
    };

    redirectByRole();
  }, [router]);

  return null;
}
