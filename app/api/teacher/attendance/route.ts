import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateAttendanceBody = {
  studentId?: string;
  subjectId?: number | string;
  date?: string;
  status?: 'present' | 'absent' | 'late' | 'sick' | 'excused';
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
    if (roleErr || requesterProfile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as CreateAttendanceBody;
    const studentId = body.studentId?.trim();
    const subjectId = Number(body.subjectId);
    const date = body.date?.trim();
    const status = body.status;

    if (!studentId || !subjectId || !date || !status) {
      return NextResponse.json({ error: 'studentId, subjectId, date, status are required' }, { status: 400 });
    }
    const allowedStatuses = new Set(['present', 'absent', 'late', 'sick', 'excused']);
    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient
      .from('attendance')
      .upsert(
        {
          student_id: studentId,
          subject_id: subjectId,
          date,
          status,
        },
        { onConflict: 'student_id,subject_id,date' }
      )
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, attendance: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
