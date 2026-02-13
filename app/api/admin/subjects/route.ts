import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateSubjectBody = {
  name?: string;
  teacherId?: string | null;
};

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

    const body = (await req.json()) as CreateSubjectBody;
    const name = body.name?.trim();
    const teacherId = body.teacherId?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: subject, error: insertErr } = await adminClient
      .from('subjects')
      .insert({ name, teacher_id: teacherId })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
