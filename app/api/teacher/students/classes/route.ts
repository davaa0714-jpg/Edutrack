import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type ClassRow = { id: number; name: string; grade_level: string | null };

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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.replace('Bearer ', '').trim();

    const ctx = await getTeacherContext(accessToken);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    const { requesterId, adminClient } = ctx;

    const { data: subjects, error: subjectsErr } = await adminClient
      .from('subjects')
      .select('id')
      .eq('teacher_id', requesterId);
    if (subjectsErr) return NextResponse.json({ error: subjectsErr.message }, { status: 400 });

    const subjectIds = (subjects || []).map((s) => s.id);
    if (subjectIds.length === 0) return NextResponse.json({ classes: [] });

    const { data: schedules, error: schedulesErr } = await adminClient
      .from('schedules')
      .select('class_id, subject_id')
      .in('subject_id', subjectIds);
    if (schedulesErr) return NextResponse.json({ error: schedulesErr.message }, { status: 400 });

    const classIdsFromSchedule = uniq((schedules || []).map((s) => s.class_id).filter(Boolean));

    const subjectsByClass = new Map<number, Set<number>>();
    (schedules || []).forEach((s) => {
      const classId = s.class_id;
      const subjectId = s.subject_id;
      if (!classId || !subjectId) return;
      if (!subjectsByClass.has(classId)) subjectsByClass.set(classId, new Set());
      subjectsByClass.get(classId)!.add(subjectId);
    });

    const [{ data: enrollRows }, { data: gradeRows }, { data: attendRows }] = await Promise.all([
      adminClient.from('enrollments').select('student_id, subject_id').in('subject_id', subjectIds),
      adminClient.from('grades').select('student_id, subject_id').in('subject_id', subjectIds),
      adminClient.from('attendance').select('student_id, subject_id').in('subject_id', subjectIds),
    ]);

    const linkedStudentIds = uniq(
      [
        ...((enrollRows || []) as Array<{ student_id: string; subject_id: number }>).map((r) => r.student_id),
        ...((gradeRows || []) as Array<{ student_id: string; subject_id: number }>).map((r) => r.student_id),
        ...((attendRows || []) as Array<{ student_id: string; subject_id: number }>).map((r) => r.student_id),
      ].filter(Boolean),
    );

    const classIdSet = new Set<number>(classIdsFromSchedule);
    if (linkedStudentIds.length > 0) {
      const { data: linkedMemberships } = await adminClient
        .from('class_memberships')
        .select('class_id')
        .in('student_id', linkedStudentIds);
      (linkedMemberships || []).forEach((m) => {
        if (m.class_id) classIdSet.add(m.class_id);
      });
    }

    const classIds = Array.from(classIdSet);
    if (classIds.length === 0) return NextResponse.json({ classes: [] });

    const { data: classRows, error: classesErr } = await adminClient
      .from('classes')
      .select('id, name, grade_level')
      .in('id', classIds)
      .order('name');
    if (classesErr) return NextResponse.json({ error: classesErr.message }, { status: 400 });

    const { data: members } = await adminClient
      .from('class_memberships')
      .select('class_id, student_id')
      .in('class_id', classIds);

    const memberMap = new Map<number, Set<string>>();
    (members || []).forEach((m) => {
      if (!memberMap.has(m.class_id)) memberMap.set(m.class_id, new Set());
      memberMap.get(m.class_id)!.add(m.student_id);
    });

    // Fallback source: profiles.class_name
    const classNameToId = new Map<string, number>();
    (classRows || []).forEach((c) => classNameToId.set((c.name || '').trim().toLowerCase(), c.id));
    if (linkedStudentIds.length > 0) {
      const { data: profileRows } = await adminClient
        .from('profiles')
        .select('id, class_name, role')
        .eq('role', 'student')
        .in('id', linkedStudentIds);
      (profileRows || []).forEach((p) => {
        const key = (p.class_name || '').trim().toLowerCase();
        const classId = classNameToId.get(key);
        if (!classId) return;
        if (!memberMap.has(classId)) memberMap.set(classId, new Set());
        memberMap.get(classId)!.add(p.id);
      });
    }

    // Fallback sources by subject membership (for datasets without class membership links).
    const addBySubjectRows = (
      rows: Array<{ student_id: string; subject_id: number }> | null,
    ) => {
      (rows || []).forEach((r) => {
        subjectsByClass.forEach((subSet, classId) => {
          if (!subSet.has(r.subject_id)) return;
          if (!memberMap.has(classId)) memberMap.set(classId, new Set());
          memberMap.get(classId)!.add(r.student_id);
        });
      });
    };

    addBySubjectRows(enrollRows as Array<{ student_id: string; subject_id: number }> | null);
    addBySubjectRows(gradeRows as Array<{ student_id: string; subject_id: number }> | null);
    addBySubjectRows(attendRows as Array<{ student_id: string; subject_id: number }> | null);

    const out = (classRows || []).map((c: ClassRow) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.grade_level,
      studentCount: memberMap.get(c.id)?.size || 0,
    }));

    return NextResponse.json({ classes: out });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
