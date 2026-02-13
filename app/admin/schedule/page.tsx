'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Class, Schedule, Subject } from '@/types';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/app/components/AppSidebar';

type ScheduleWithMeta = Schedule & { subjects?: { name: string } | null; classes?: { name: string } | null };
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminSchedulePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<ScheduleWithMeta[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('1');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile?.role !== 'admin') return router.replace('/dashboard');

      const [{ data: classData }, { data: subjectData }, { data: scheduleData }] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('schedules').select('id, day_of_week, start_time, end_time, room, subject_id, class_id, created_at, subjects(name), classes(name)').order('day_of_week'),
      ]);
      if (classData) setClasses(classData);
      if (subjectData) setSubjects(subjectData);
      if (scheduleData) setItems(scheduleData as ScheduleWithMeta[]);
    };
    load();
  }, [router]);

  const hasConflict = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('id')
      .eq('class_id', Number(classId))
      .eq('day_of_week', Number(day))
      .lt('start_time', endTime)
      .gt('end_time', startTime);
    return (data || []).length > 0;
  };

  const createSchedule = async () => {
    if (!classId || !subjectId || !startTime || !endTime) return;
    const conflict = await hasConflict();
    if (conflict) return alert('Schedule conflict detected for this class and time');

    const { error } = await supabase.from('schedules').insert({
      class_id: Number(classId),
      subject_id: Number(subjectId),
      day_of_week: Number(day),
      start_time: startTime,
      end_time: endTime,
      room: room || null,
    });
    if (error) return alert(error.message);
    setClassId('');
    setSubjectId('');
    setDay('1');
    setStartTime('');
    setEndTime('');
    setRoom('');
    router.refresh();
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <h1 className="text-2xl font-semibold fade-up">{t('scheduleManage')}</h1>
          <section className="soft-panel mt-6 fade-up delay-1">
            <div className="grid gap-3 md:grid-cols-3">
              <select className="select-field" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">{t('selectClass')}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="select-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">{t('selectSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="select-field" value={day} onChange={(e) => setDay(e.target.value)}>
                {days.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </select>
              <input className="input-field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <input className="input-field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <input className="input-field" placeholder={t('room')} value={room} onChange={(e) => setRoom(e.target.value)} />
            </div>
            <button className="btn-primary mt-4" onClick={createSchedule}>{t('createSchedule')}</button>
          </section>

          <div className="mt-6 space-y-3 fade-up delay-2">
            {items.map((s) => (
              <div key={s.id} className="soft-panel soft-panel-muted">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.subjects?.name || t('unknown')}</p>
                  <span className="tag">{s.classes?.name || '-'}</span>
                </div>
                <p className="text-sm text-muted">{days[(s.day_of_week || 1) - 1]} · {s.start_time} - {s.end_time} · {s.room || 'Room'}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
