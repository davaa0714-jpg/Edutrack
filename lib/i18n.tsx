 'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'mn' | 'en';

type Dictionary = Record<string, { mn: string; en: string }>;

const dictionary: Dictionary = {
  appName: { mn: 'EduTrack', en: 'EduTrack' },
  login: { mn: 'Нэвтрэх', en: 'Login' },
  register: { mn: 'Бүртгүүлэх', en: 'Register' },
  dashboard: { mn: 'Хяналтын самбар', en: 'Dashboard' },
  grades: { mn: 'Дүн', en: 'Grades' },
  attendance: { mn: 'Ирц', en: 'Attendance' },
  reports: { mn: 'Тайлан', en: 'Reports' },
  schedule: { mn: 'Хуваарь', en: 'Schedule' },
  settings: { mn: 'Тохиргоо', en: 'Settings' },
  overview: { mn: 'Тойм', en: 'Overview' },
  hello: { mn: 'Сайн байна уу', en: 'Good morning' },
  todayHighlights: { mn: 'Өнөөдрийн тойм мэдээлэл', en: 'Your highlights for today' },
  downloadReport: { mn: 'PDF тайлан татах', en: 'Download PDF Report' },
  averageScore: { mn: 'Дундаж оноо', en: 'Average score' },
  attendanceRate: { mn: 'Ирцийн хувь', en: 'Attendance rate' },
  realtimeSync: { mn: 'Realtime шинэчлэлт', en: 'Realtime sync' },
  live: { mn: 'Шууд', en: 'Live' },
  pending: { mn: 'Хүлээгдэж байна', en: 'Pending' },
  updatedNow: { mn: 'Шинэчлэгдсэн', en: 'Updated now' },
  last30Days: { mn: 'Сүүлийн 30 өдөр', en: 'Last 30 days' },
  subject: { mn: 'Хичээл', en: 'Subject' },
  score: { mn: 'Оноо', en: 'Score' },
  status: { mn: 'Төлөв', en: 'Status' },
  date: { mn: 'Огноо', en: 'Date' },
  noGrades: { mn: 'Одоогоор дүн алга байна.', en: 'No grades yet.' },
  noAttendance: { mn: 'Одоогоор ирцийн мэдээлэл алга байна.', en: 'No attendance records yet.' },
  profile: { mn: 'Профайл', en: 'Profile' },
  activeStudent: { mn: 'Идэвхтэй оюутан', en: 'Active student account' },
  records: { mn: 'бичлэг', en: 'records' },
  instantUpdates: { mn: 'Шууд шинэчлэлт идэвхтэй', en: 'Instant updates enabled' },
  roleStudents: { mn: 'Оюутнууд', en: 'Students' },
  roleTeachers: { mn: 'Багш нар', en: 'Teachers' },
  roleAdmins: { mn: 'Админ', en: 'Admins' },
  homeTitle: { mn: 'Сургалтын үр дүнд төвлөрсөн цэвэрхэн дизайн', en: 'Modern, clean, and focused on learning outcomes' },
  homeSubtitle: { mn: 'Дүн, ирц, тайланг нэг төвд.', en: 'Centralize grades, attendance, and reports in one place.' },
  homeFeature1: { mn: 'Бодит цагийн шинэчлэлт', en: 'Realtime insights' },
  homeFeature1Desc: { mn: 'Дүн, ирц бодит цагт шинэчлэгдэнэ.', en: 'Live updates on grades and attendance.' },
  homeFeature2: { mn: 'Эрхийн бүтэц', en: 'Role-based access' },
  homeFeature2Desc: { mn: 'Оюутан, багш, админ тусдаа эрхтэй.', en: 'Tailored experiences for every role.' },
  homeFeature3: { mn: 'PDF тайлан', en: 'Export-ready reports' },
  homeFeature3Desc: { mn: 'Тайланг шууд татаж авна.', en: 'Generate PDF summaries instantly.' },
  builtForEveryRole: { mn: 'Бүх үүрэгт тохирсон', en: 'Built for every role' },
  builtForEveryRoleDesc: { mn: 'Өдөр тутмын ирцээс урт хугацааны гүйцэтгэл хүртэл.', en: 'From daily attendance to long-term performance tracking.' },
  quickStart: { mn: 'Шуурхай эхлэх', en: 'Quick start' },
  goLogin: { mn: 'Нэвтрэх', en: 'Go to Login' },
  createAccount: { mn: 'Бүртгүүлэх', en: 'Create an account' },
  signInTitle: { mn: 'Нэвтрэх', en: 'Sign in' },
  signInSubtitle: { mn: 'Сургуулийн и-мэйлээр нэвтэрнэ үү.', en: 'Use your school email and password.' },
  email: { mn: 'И-мэйл', en: 'Email' },
  password: { mn: 'Нууц үг', en: 'Password' },
  fullName: { mn: 'Овог нэр', en: 'Full name' },
  role: { mn: 'Эрх', en: 'Role' },
  namePlaceholder: { mn: 'Овог Нэр', en: 'Full Name' },
  passwordPlaceholder: { mn: 'Нууц үг үүсгэнэ үү', en: 'Create a secure password' },
  joinTitle: { mn: 'Бүртгэл үүсгэх', en: 'Create your account' },
  joinSubtitle: { mn: 'Профайл үүсгээд системээ ашиглаарай.', en: 'Set up your profile to personalize your dashboard.' },
  benefitsTitle: { mn: 'Давуу тал', en: 'What you get' },
  benefit1: { mn: 'Дүнгийн тодорхой шинжилгээ.', en: 'Track grades per subject with clear analytics.' },
  benefit2: { mn: 'Ирц бодит цагт шинэчлэгдэнэ.', en: 'Attendance timelines updated in real time.' },
  benefit3: { mn: 'Эцэг эхийн уулзалтад зориулсан PDF.', en: 'Download performance PDFs for parent meetings.' },
  policyNote: { mn: 'Бүртгүүлэхдээ сургуулийн дүрмийг зөвшөөрнө.', en: "By registering, you agree to your school's usage policy." },
  loginWelcome: { mn: 'Тавтай морилно уу', en: 'Welcome back' },
  loginTagline: { mn: 'Бүх ахицыг нэг дороос.', en: 'Track progress in one place.' },
  loginBullet1: { mn: 'Дүн, ирц бодит цагт.', en: 'Realtime grades and attendance updates.' },
  loginBullet2: { mn: 'PDF тайлан татах.', en: 'Downloadable student performance reports.' },
  loginBullet3: { mn: 'Аюулгүй нэвтрэлт.', en: 'Secure access for students and teachers.' },
  loginFooter: { mn: 'Бүртгэлгүй бол сургуультайгаа холбогдоорой.', en: "Don't have an account? Contact your school." },
  teacherWorkspace: { mn: 'Багшийн булан', en: 'Teacher workspace' },
  selectSubject: { mn: 'Хичээл сонгох', en: 'Select subject' },
  adminConsole: { mn: 'Админ самбар', en: 'Admin Console' },
  manageUsers: { mn: 'Хэрэглэгч удирдах', en: 'Manage users and access' },
  manageRoles: { mn: 'Эрхийн удирдлага', en: 'Manage roles' },
  createUser: { mn: 'Хэрэглэгч нэмэх', en: 'Create user' },
  subjects: { mn: 'Хичээлүүд', en: 'Subjects' },
  users: { mn: 'Хэрэглэгчид', en: 'Users' },
  rolesAndAccess: { mn: 'Эрх ба нэвтрэлт', en: 'Roles and access' },
  selectSubjectTitle: { mn: 'Хичээл сонго', en: 'Select subject' },
  enrollmentsGrades: { mn: 'Бүртгэл & Дүн', en: 'Enrollments & Grades' },
  today: { mn: 'Өнөөдөр', en: 'Today' },
  save: { mn: 'Хадгалах', en: 'Save' },
  summary: { mn: 'Товчоон', en: 'Summary' },
  noSubjects: { mn: 'Одоогоор хичээл алга байна.', en: 'No subjects yet.' },
  usersCount: { mn: 'нийт хэрэглэгч', en: 'total users' },
  noUsers: { mn: 'Хэрэглэгч олдсонгүй.', en: 'No users found.' },
  manageClasses: { mn: 'Анги, хичээлийн удирдлага', en: 'Manage classes & updates' },
  activeClasses: { mn: 'Идэвхтэй анги', en: 'Active classes' },
  scheduleManage: { mn: 'Хуваарь зохицуулалт', en: 'Schedule management' },
  createSchedule: { mn: 'Хуваарь үүсгэх', en: 'Create schedule' },
  dayOfWeek: { mn: 'Гараг', en: 'Day of week' },
  startTime: { mn: 'Эхлэх цаг', en: 'Start time' },
  endTime: { mn: 'Дуусах цаг', en: 'End time' },
  room: { mn: 'Танхим', en: 'Room' },
  teacherDashboard: { mn: 'Багшийн самбар', en: 'Teacher dashboard' },
  studentDashboard: { mn: 'Сурагчийн самбар', en: 'Student dashboard' },
  enterAttendance: { mn: 'Ирц оруулах', en: 'Enter attendance' },
  enterGrade: { mn: 'Дүн оруулах', en: 'Enter grade' },
  selectStudent: { mn: 'Сурагч сонгох', en: 'Select student' },
  selectClass: { mn: 'Анги сонгох', en: 'Select class' },
  selectDate: { mn: 'Огноо сонгох', en: 'Select date' },
  publish: { mn: 'Нийтлэх', en: 'Publish' },
  myAttendance: { mn: 'Миний ирц', en: 'My attendance' },
  myGrades: { mn: 'Миний дүн', en: 'My grades' },
  submitAttendance: { mn: 'Ирц бүртгэх', en: 'Submit attendance' },
  studentId: { mn: 'Оюутны ID', en: 'Student ID' },
  actions: { mn: 'Үйлдэл', en: 'Actions' },
  noEnrollments: { mn: 'Энэ хичээлд бүртгэл алга байна.', en: 'No enrollments for this subject yet.' },
  present: { mn: 'Ирсэн', en: 'Present' },
  absent: { mn: 'Тасалсан', en: 'Absent' },
  late: { mn: 'Хоцорсон', en: 'Late' },
  id: { mn: 'Дугаар', en: 'ID' },
  reportFor: { mn: 'Тайлан: ', en: 'Report for ' },
  gradesLabel: { mn: 'Дүн', en: 'Grades' },
  attendanceLabel: { mn: 'Ирц', en: 'Attendance' },
  unknown: { mn: 'Тодорхойгүй', en: 'Unknown' },
  userCreateAlert: { mn: 'Supabase Auth дээр хэрэглэгч үүсгэх шаардлагатай.', en: 'User creation via Supabase Auth required.' },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof dictionary) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'mn';
    const saved = localStorage.getItem('edutrack_lang') as Language | null;
    return saved === 'en' ? 'en' : 'mn';
  });

  useEffect(() => {
    localStorage.setItem('edutrack_lang', language);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => dictionary[key][language],
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
