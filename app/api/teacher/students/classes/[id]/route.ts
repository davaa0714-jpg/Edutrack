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
    const classId = Number(id);
    if (!classId) return NextResponse.json({ error: 'Invalid class id' }, { status: 400 });

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

    const { data: schedules } = await adminClient
      .from('schedules')
      .select('class_id, subject_id')
      .in('subject_id', subjectIds);

    const allowedClassIds = new Set((schedules || []).map((s) => s.class_id).filter(Boolean));
    const [{ data: enr }, { data: grd }, { data: att }] = await Promise.all([
      adminClient.from('enrollments').select('student_id').in('subject_id', subjectIds),
      adminClient.from('grades').select('student_id').in('subject_id', subjectIds),
      adminClient.from('attendance').select('student_id').in('subject_id', subjectIds),
    ]);
    const linkedStudentIds = uniq([
      ...((enr || []) as Array<{ student_id: string }>).map((r) => r.student_id),
      ...((grd || []) as Array<{ student_id: string }>).map((r) => r.student_id),
      ...((att || []) as Array<{ student_id: string }>).map((r) => r.student_id),
    ]);
    if (linkedStudentIds.length > 0) {
      const { data: linkedMemberships } = await adminClient
        .from('class_memberships')
        .select('class_id')
        .in('student_id', linkedStudentIds);
      (linkedMemberships || []).forEach((m) => {
        if (m.class_id) allowedClassIds.add(m.class_id);
      });
    }

    if (!allowedClassIds.has(classId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const classSubjectIds = uniq(
      (schedules || [])
        .filter((s) => s.class_id === classId)
        .map((s) => s.subject_id)
        .filter(Boolean),
    );

    const { data: classRow, error: classErr } = await adminClient
      .from('classes')
      .select('id, name, grade_level')
      .eq('id', classId)
      .single();
    if (classErr || !classRow) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const { data: members } = await adminClient
      .from('class_memberships')
      .select('student_id')
      .eq('class_id', classId);
    let studentIds = uniq((members || []).map((m) => m.student_id));

    if (studentIds.length === 0 && classRow.name) {
      const { data: profileRows } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('class_name', classRow.name);
      studentIds = uniq((profileRows || []).map((p) => p.id));
    }

    if (studentIds.length === 0 && classSubjectIds.length > 0) {
      const collect = (rows: Array<{ student_id: string }> | null) => {
        (rows || []).forEach((r) => studentIds.push(r.student_id));
      };
      const [{ data: enr }, { data: grd }, { data: att }] = await Promise.all([
        adminClient.from('enrollments').select('student_id').in('subject_id', classSubjectIds),
        adminClient.from('grades').select('student_id').in('subject_id', classSubjectIds),
        adminClient.from('attendance').select('student_id').in('subject_id', classSubjectIds),
      ]);
      collect(enr as Array<{ student_id: string }> | null);
      collect(grd as Array<{ student_id: string }> | null);
      collect(att as Array<{ student_id: string }> | null);
      studentIds = uniq(studentIds);
    }

    let students: Array<{ id: string; full_name: string | null; phone: string | null }> = [];
    if (studentIds.length > 0) {
      const { data: studentRows } = await adminClient
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', studentIds)
        .eq('role', 'student');
      students = (studentRows || []) as Array<{ id: string; full_name: string | null; phone: string | null }>;
    }

    return NextResponse.json({
      class: {
        id: classRow.id,
        name: classRow.name,
        gradeLevel: classRow.grade_level,
      },
      students: students
        .map((s) => ({ id: s.id, name: s.full_name || s.phone || 'Student' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      studentCount: students.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
