import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Ctx = { params: Promise<{ id: string }> };

type RelationName = { name: string } | { name: string }[] | null | undefined;
type RelationProfile = { full_name?: string | null; phone?: string | null } | { full_name?: string | null; phone?: string | null }[] | null | undefined;

const getName = (value: RelationName) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name || null;
  return value.name || null;
};

const getProfile = (value: RelationProfile) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
};

export async function GET(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const subjectId = Number(id);
    if (!subjectId) return NextResponse.json({ error: 'Invalid subject id' }, { status: 400 });

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
    const { data: subject, error: subjectErr } = await adminClient
      .from('subjects')
      .select('id, name, teacher_id, created_at, profiles(full_name, phone)')
      .eq('id', subjectId)
      .eq('teacher_id', requesterId)
      .single();
    if (subjectErr || !subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    const { data: schedules, error: schedulesErr } = await adminClient
      .from('schedules')
      .select('id, class_id, day_of_week, start_time, end_time, room, classes(name)')
      .eq('subject_id', subjectId)
      .order('day_of_week', { ascending: true });
    if (schedulesErr) return NextResponse.json({ error: schedulesErr.message }, { status: 400 });

    const classIds = Array.from(new Set((schedules || []).map((s) => s.class_id).filter(Boolean)));

    let memberships: Array<{ class_id: number; student_id: string }> = [];
    if (classIds.length > 0) {
      const { data: members, error: membersErr } = await adminClient
        .from('class_memberships')
        .select('class_id, student_id')
        .in('class_id', classIds);
      if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 400 });
      memberships = members || [];
    }

    // Fallback: some deployments don't use class_memberships and store class on profiles.class_name.
    if (memberships.length === 0 && classIds.length > 0) {
      const { data: classRows } = await adminClient.from('classes').select('id, name').in('id', classIds);
      const classNameToId = new Map<string, number>((classRows || []).map((c) => [c.name, c.id]));
      const names = Array.from(classNameToId.keys());
      if (names.length > 0) {
        const { data: profileRows } = await adminClient
          .from('profiles')
          .select('id, class_name, role')
          .in('class_name', names)
          .eq('role', 'student');
        memberships = (profileRows || [])
          .map((p) => {
            const classId = p.class_name ? classNameToId.get(p.class_name) : undefined;
            if (!classId) return null;
            return { class_id: classId, student_id: p.id };
          })
          .filter((v): v is { class_id: number; student_id: string } => Boolean(v));
      }
    }

    // Extra fallback source for student counts.
    const { data: enrollments } = await adminClient
      .from('enrollments')
      .select('student_id')
      .eq('subject_id', subjectId);
    const enrolledStudentIds = Array.from(new Set((enrollments || []).map((e) => e.student_id)));

    const { data: attendance, error: attendanceErr } = await adminClient
      .from('attendance')
      .select('student_id, status, date')
      .eq('subject_id', subjectId);
    if (attendanceErr) return NextResponse.json({ error: attendanceErr.message }, { status: 400 });

    const membersByClass = new Map<number, Set<string>>();
    memberships.forEach((m) => {
      if (!membersByClass.has(m.class_id)) membersByClass.set(m.class_id, new Set());
      membersByClass.get(m.class_id)!.add(m.student_id);
    });

    const classMeta = new Map<number, { name: string; slots: string[] }>();
    (schedules || []).forEach((row) => {
      const classId = row.class_id;
      if (!classId) return;
      const className = getName(row.classes as RelationName) || `Class ${classId}`;
      if (!classMeta.has(classId)) classMeta.set(classId, { name: className, slots: [] });
      const day = row.day_of_week || 1;
      const slot = `${day} ${row.start_time}-${row.end_time}${row.room ? ` (${row.room})` : ''}`;
      classMeta.get(classId)!.slots.push(slot);
    });

    const classStats = Array.from(classMeta.entries()).map(([classId, meta]) => ({
      classId,
      className: meta.name,
      slots: meta.slots,
      students: membersByClass.get(classId)?.size || 0,
      present: 0,
      absent: 0,
      sick: 0,
      excused: 0,
      late: 0,
      total: 0,
      presentRate: 0,
    }));

    const statByClass = new Map(classStats.map((s) => [s.classId, s]));
    (attendance || []).forEach((a) => {
      membersByClass.forEach((studentSet, classId) => {
        if (!studentSet.has(a.student_id)) return;
        const stat = statByClass.get(classId);
        if (!stat) return;
        stat.total += 1;
        if (a.status === 'present') stat.present += 1;
        else if (a.status === 'absent') stat.absent += 1;
        else if (a.status === 'sick') stat.sick += 1;
        else if (a.status === 'excused') stat.excused += 1;
        else if (a.status === 'late') stat.late += 1;
      });
    });

    // If we still cannot map students to class (legacy/no membership data),
    // but this subject has a single class, use subject-level attendance totals.
    if (classStats.length === 1 && classStats[0].total === 0) {
      const only = classStats[0];
      (attendance || []).forEach((a) => {
        only.total += 1;
        if (a.status === 'present') only.present += 1;
        else if (a.status === 'absent') only.absent += 1;
        else if (a.status === 'sick') only.sick += 1;
        else if (a.status === 'excused') only.excused += 1;
        else if (a.status === 'late') only.late += 1;
      });
      if (only.students === 0) {
        const attendanceStudents = Array.from(new Set((attendance || []).map((a) => a.student_id)));
        only.students = attendanceStudents.length || enrolledStudentIds.length;
      }
    }

    classStats.forEach((s) => {
      s.presentRate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
    });

    const teacher = getProfile(subject.profiles as RelationProfile);

    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
      },
      teacher: {
        id: subject.teacher_id,
        name: teacher?.full_name || 'Teacher',
        phone: teacher?.phone || null,
      },
      classStats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
