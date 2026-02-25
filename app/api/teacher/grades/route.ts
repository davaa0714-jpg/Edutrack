import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateGradeBody = {
  studentId?: string;
  subjectId?: number | string;
  score?: number | string;
};

export async function GET(req: Request) {
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

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: subjects, error: subjectErr } = await adminClient
      .from('subjects')
      .select('id')
      .eq('teacher_id', requesterId);
    if (subjectErr) return NextResponse.json({ error: subjectErr.message }, { status: 400 });

    const subjectIds = (subjects || []).map((s) => s.id);
    if (subjectIds.length === 0) return NextResponse.json({ grades: [] });

    const { data: grades, error: gradesErr } = await adminClient
      .from('grades')
      .select('id, score, subject_id, student_id, created_at, subjects(name)')
      .in('subject_id', subjectIds)
      .order('created_at', { ascending: false });
    if (gradesErr) return NextResponse.json({ error: gradesErr.message }, { status: 400 });

    return NextResponse.json({ grades: grades || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = (await req.json()) as CreateGradeBody;
    const studentId = body.studentId?.trim();
    const subjectId = Number(body.subjectId);
    const score = Number(body.score);

    if (!studentId || !subjectId || Number.isNaN(score)) {
      return NextResponse.json({ error: 'studentId, subjectId, score are required' }, { status: 400 });
    }
    if (score < 0 || score > 100) {
      return NextResponse.json({ error: 'Score must be 0-100' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient
      .from('grades')
      .upsert(
        {
          student_id: studentId,
          subject_id: subjectId,
          score,
        },
        { onConflict: 'student_id,subject_id' }
      )
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, grade: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
