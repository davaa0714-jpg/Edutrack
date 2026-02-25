import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Ctx = { params: Promise<{ id: string }> };

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

async function getTeacherContext(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Supabase server env missing. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const requesterClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: requesterUser, error: requesterErr } = await requesterClient.auth.getUser();
  const requesterId = requesterUser?.user?.id;
  if (requesterErr || !requesterId) return { error: 'Unauthorized', status: 401 as const };

  const { data: requesterProfile, error: roleErr } = await requesterClient
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .single();
  if (roleErr || requesterProfile?.role !== 'teacher') return { error: 'Forbidden', status: 403 as const };

  const adminClient = createClient(supabaseUrl, serviceKey);
  return { requesterId, adminClient };
}

export async function GET(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const studentId = id?.trim();
    if (!studentId) return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.replace('Bearer ', '').trim();

    const ctx = await getTeacherContext(accessToken);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    const { requesterId, adminClient } = ctx;

    const { data: subjects } = await adminClient
      .from('subjects')
      .select('id')
      .eq('teacher_id', requesterId);
    const subjectIds = (subjects || []).map((s) => s.id);
    if (subjectIds.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Permission check: student must be connected by class, enrollment, grades, or attendance.
    let allowed = false;

    const { data: schedules } = await adminClient
      .from('schedules')
      .select('class_id')
      .in('subject_id', subjectIds);
    const classIds = uniq((schedules || []).map((s) => s.class_id).filter(Boolean));

    if (classIds.length > 0) {
      const { data: members } = await adminClient
        .from('class_memberships')
        .select('student_id')
        .in('class_id', classIds)
        .eq('student_id', studentId);
      if ((members || []).length > 0) allowed = true;
    }

    if (!allowed) {
      const { data: enr } = await adminClient
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .in('subject_id', subjectIds)
        .limit(1);
      if ((enr || []).length > 0) allowed = true;
    }

    if (!allowed) {
      const { data: grd } = await adminClient
        .from('grades')
        .select('id')
        .eq('student_id', studentId)
        .in('subject_id', subjectIds)
        .limit(1);
      if ((grd || []).length > 0) allowed = true;
    }

    if (!allowed) {
      const { data: att } = await adminClient
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .in('subject_id', subjectIds)
        .limit(1);
      if ((att || []).length > 0) allowed = true;
    }

    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [{ data: grades }, { data: attendance }] = await Promise.all([
      adminClient
        .from('grades')
        .select('score, subject_id, created_at, subjects(name)')
        .eq('student_id', studentId)
        .in('subject_id', subjectIds)
        .order('created_at', { ascending: false })
        .limit(10),
      adminClient
        .from('attendance')
        .select('status, subject_id, date, subjects(name)')
        .eq('student_id', studentId)
        .in('subject_id', subjectIds)
        .order('date', { ascending: false })
        .limit(30),
    ]);

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, first_name, last_name, class_name, phone, avatar_url, bio, created_at')
      .eq('id', studentId)
      .maybeSingle();

    const present = (attendance || []).filter((a) => a.status === 'present').length;
    const total = (attendance || []).length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const avgScore =
      (grades || []).length > 0
        ? Math.round((grades || []).reduce((acc, g) => acc + Number(g.score || 0), 0) / (grades || []).length)
        : null;

    return NextResponse.json({
      student: {
        id: profile?.id || studentId,
        name:
          profile?.full_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          'Student',
        className: profile?.class_name || '-',
        phone: profile?.phone || null,
        bio: profile?.bio || null,
        joinedAt: profile?.created_at || new Date().toISOString(),
      },
      stats: {
        attendanceRate,
        gradeAverage: avgScore,
        records: total,
      },
      recentGrades: grades || [],
      recentAttendance: attendance || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
