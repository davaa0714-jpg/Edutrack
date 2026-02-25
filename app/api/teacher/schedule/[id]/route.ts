import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Ctx = { params: Promise<{ id: string }> };
type RelationName = { name: string } | { name: string }[] | null | undefined;

const getName = (value: RelationName) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name || null;
  return value.name || null;
};

export async function GET(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const scheduleId = Number(id);
    if (!scheduleId) return NextResponse.json({ error: 'Invalid schedule id' }, { status: 400 });

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
    const { data: schedule, error: scheduleErr } = await adminClient
      .from('schedules')
      .select('id, day_of_week, start_time, end_time, room, class_id, subject_id, created_at, subjects(name), classes(name)')
      .eq('id', scheduleId)
      .single();
    if (scheduleErr || !schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    // Ensure this schedule belongs to a subject taught by current teacher.
    const { data: subjectCheck } = await adminClient
      .from('subjects')
      .select('id, name')
      .eq('id', schedule.subject_id)
      .eq('teacher_id', requesterId)
      .single();
    if (!subjectCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let students: Array<{ id: string; full_name: string | null; phone: string | null }> = [];
    const studentIdSet = new Set<string>();
    if (schedule.class_id) {
      const { data: members } = await adminClient
        .from('class_memberships')
        .select('student_id')
        .eq('class_id', schedule.class_id);
      (members || []).forEach((m) => studentIdSet.add(m.student_id));

      // Fallback 1: profiles.class_name (normalize case/spaces).
      const { data: classRow } = await adminClient.from('classes').select('name').eq('id', schedule.class_id).single();
      if (classRow?.name) {
        const target = classRow.name.replace(/\s+/g, '').toLowerCase();
        const { data: profileRows } = await adminClient
          .from('profiles')
          .select('id, class_name, role')
          .eq('role', 'student');
        (profileRows || []).forEach((p) => {
          const key = (p.class_name || '').replace(/\s+/g, '').toLowerCase();
          if (key && key === target) studentIdSet.add(p.id);
        });
      }
    }

    // Fallback 2: students linked to this subject by records.
    const [{ data: enrRows }, { data: gradeRows }, { data: attRows }] = await Promise.all([
      adminClient.from('enrollments').select('student_id').eq('subject_id', schedule.subject_id),
      adminClient.from('grades').select('student_id').eq('subject_id', schedule.subject_id),
      adminClient.from('attendance').select('student_id').eq('subject_id', schedule.subject_id),
    ]);
    (enrRows || []).forEach((r) => studentIdSet.add(r.student_id));
    (gradeRows || []).forEach((r) => studentIdSet.add(r.student_id));
    (attRows || []).forEach((r) => studentIdSet.add(r.student_id));

    const studentIds = Array.from(studentIdSet);
    if (studentIds.length > 0) {
      const { data: studentRows } = await adminClient
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', studentIds)
        .eq('role', 'student');
      students = (studentRows || []) as Array<{ id: string; full_name: string | null; phone: string | null }>;
    }

    const url = new URL(req.url);
    const selectedDate = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    let attendanceMap: Record<string, string> = {};
    if (studentIds.length > 0) {
      const { data: dayAttendance } = await adminClient
        .from('attendance')
        .select('student_id, status')
        .eq('subject_id', schedule.subject_id)
        .eq('date', selectedDate)
        .in('student_id', studentIds);
      attendanceMap = Object.fromEntries((dayAttendance || []).map((r) => [r.student_id, r.status]));
    }

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        subjectId: schedule.subject_id,
        subjectName: getName(schedule.subjects as RelationName) || subjectCheck.name || 'Subject',
        classId: schedule.class_id,
        className: getName(schedule.classes as RelationName) || 'Class',
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        room: schedule.room,
      },
      students: students.map((s) => ({
        id: s.id,
        name: s.full_name || s.phone || 'Student',
        status: attendanceMap[s.id] || null,
      })),
      studentCount: students.length,
      date: selectedDate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
