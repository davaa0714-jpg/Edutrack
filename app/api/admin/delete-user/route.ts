import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type DeleteBody = { userId?: string };

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: 'Supabase server env missing. Set SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.replace('Bearer ', '').trim();

    const requesterClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: requesterUser, error: requesterErr } = await requesterClient.auth.getUser();
    const requesterId = requesterUser?.user?.id;
    if (requesterErr || !requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requesterProfile, error: roleErr } = await requesterClient
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();
    if (roleErr || requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as DeleteBody;
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (userId === requesterId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from('activity_logs').delete().eq('actor_id', userId);
    await adminClient.from('attendance').delete().eq('student_id', userId);
    await adminClient.from('class_memberships').delete().eq('student_id', userId);
    await adminClient.from('enrollments').delete().eq('student_id', userId);
    await adminClient.from('grades').delete().eq('student_id', userId);
    await adminClient.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    await adminClient.from('notifications').delete().eq('user_id', userId);
    await adminClient.from('reports').delete().eq('student_id', userId);
    await adminClient.from('student_guardians').delete().eq('student_id', userId);
    await adminClient.from('submissions').delete().eq('student_id', userId);

    await adminClient.from('announcements').update({ created_by: null }).eq('created_by', userId);
    await adminClient.from('classes').update({ homeroom_teacher_id: null }).eq('homeroom_teacher_id', userId);
    await adminClient.from('subjects').update({ teacher_id: null }).eq('teacher_id', userId);

    // schedules.teacher_id may not exist in every deployment; ignore error intentionally.
    await adminClient.from('schedules').update({ teacher_id: null }).eq('teacher_id', userId);

    const { error: profileDeleteError } = await adminClient.from('profiles').delete().eq('id', userId);
    if (profileDeleteError) {
      return NextResponse.json({ error: profileDeleteError.message }, { status: 400 });
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

