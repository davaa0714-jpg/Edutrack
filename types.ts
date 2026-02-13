export type Role = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  class_name?: string | null;
  role: Role;
  created_at: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  updated_at?: string | null;
}

export interface Subject {
  id: number;
  name: string;
  teacher_id: string;
  created_at: string;
}

export interface Class {
  id: number;
  name: string;
  grade_level: string | null;
  homeroom_teacher_id: string | null;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string | null;
  created_by: string | null;
  target_class_id: number | null;
  created_at: string;
}

export interface Assignment {
  id: number;
  subject_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Enrollment {
  id: number;
  student_id: string;
  subject_id: number;
  created_at: string;
}

export interface ClassMembership {
  id: number;
  class_id: number;
  student_id: string;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';
export interface Attendance {
  id: number;
  student_id: string;
  subject_id: number;
  date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface Grade {
  id: number;
  student_id: string;
  subject_id: number;
  score: number;
  created_at: string;
}

export interface Schedule {
  id: number;
  subject_id: number;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  type: 'in_app' | 'email' | 'push';
  created_at: string;
}

// Supabase-аас join query-аар ирсэн data-д зориулсан
export interface GradeWithSubject extends Grade {
  subjects: { name: string }[];
}

export interface AttendanceWithSubject extends Attendance {
  subjects: { name: string }[];
}
