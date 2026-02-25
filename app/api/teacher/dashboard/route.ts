import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const accessToken = authHeader.replace('Bearer ', '').trim();

    const requesterClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: requesterUser, error: requesterErr } = await requesterClient.auth.getUser();
    const requesterId = requesterUser?.user?.id;
    if (requesterErr || !requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile, error: roleErr } = await requesterClient
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();
    if (roleErr || requesterProfile?.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: subjects, error: subjectsErr } = await adminClient
      .from('subjects')
      .select('id')
      .eq('teacher_id', requesterId);
    if (subjectsErr) return NextResponse.json({ error: subjectsErr.message }, { status: 400 });

    const subjectIds = (subjects || []).map((s) => s.id);
    const subjectCount = subjectIds.length;
    if (subjectIds.length === 0) return NextResponse.json({ subjectCount, studentCount: 0 });

    const { data: schedules } = await adminClient
      .from('schedules')
      .select('class_id')
      .in('subject_id', subjectIds);
    const classIds = Array.from(new Set((schedules || []).map((s) => s.class_id).filter(Boolean)));

    const studentIds = new Set<string>();

    if (classIds.length > 0) {
      const { data: members } = await adminClient
        .from('class_memberships')
        .select('student_id')
        .in('class_id', classIds);
      (members || []).forEach((m) => studentIds.add(m.student_id));

      // Fallback for deployments using profiles.class_name.
      const { data: classRows } = await adminClient.from('classes').select('id, name').in('id', classIds);
      const classNameSet = new Set((classRows || []).map((c) => (c.name || '').trim().toLowerCase()).filter(Boolean));
      if (classNameSet.size > 0) {
        const { data: profileRows } = await adminClient
          .from('profiles')
          .select('id, class_name, role')
          .eq('role', 'student');
        (profileRows || []).forEach((p) => {
          const key = (p.class_name || '').trim().toLowerCase();
          if (key && classNameSet.has(key)) studentIds.add(p.id);
        });
      }
    }

    const { data: enrollments } = await adminClient
      .from('enrollments')
      .select('student_id')
      .in('subject_id', subjectIds);
    (enrollments || []).forEach((e) => studentIds.add(e.student_id));

    // Extra fallbacks: any student with grades/attendance in teacher's subjects.
    const { data: gradeRows } = await adminClient
      .from('grades')
      .select('student_id')
      .in('subject_id', subjectIds);
    (gradeRows || []).forEach((g) => studentIds.add(g.student_id));

    const { data: attendanceRows } = await adminClient
      .from('attendance')
      .select('student_id')
      .in('subject_id', subjectIds);
    (attendanceRows || []).forEach((a) => studentIds.add(a.student_id));

    return NextResponse.json({ subjectCount, studentCount: studentIds.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
