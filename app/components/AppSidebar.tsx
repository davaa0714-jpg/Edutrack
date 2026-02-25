'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { Icon } from '@/app/components/Icons';

const roleItems: Record<string, Array<{ href: string; label: string; icon: ComponentType }>> = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: Icon.Home },
    { href: '/student/grades', label: 'Grades', icon: Icon.Chart },
    { href: '/student/attendance', label: 'Attendance', icon: Icon.Calendar },
    { href: '/student/schedule', label: 'Schedule', icon: Icon.Calendar },
    { href: '/reports', label: 'Reports', icon: Icon.FileText },
    { href: '/profile', label: 'Profile', icon: Icon.Users },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: Icon.Home },
    { href: '/teacher/students', label: 'Students', icon: Icon.Users },
    { href: '/teacher/grades', label: 'Grades', icon: Icon.Chart },
    { href: '/teacher/attendance', label: 'Attendance', icon: Icon.Calendar },
    { href: '/teacher/schedule', label: 'Schedule', icon: Icon.Calendar },
    { href: '/subjects', label: 'Subjects', icon: Icon.Book },
    { href: '/profile', label: 'Profile', icon: Icon.Users },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Icon.Home },
    { href: '/admin/users', label: 'Users', icon: Icon.Users },
    { href: '/admin/roles', label: 'Roles', icon: Icon.Settings },
    { href: '/admin/classes', label: 'Classes', icon: Icon.Users },
    { href: '/admin/announcements', label: 'Announcements', icon: Icon.FileText },
    { href: '/admin/assignments', label: 'Assignments', icon: Icon.Chart },
    { href: '/admin/schedule', label: 'Schedule', icon: Icon.Calendar },
    { href: '/admin/subjects', label: 'Subjects', icon: Icon.Book },
  ],
};

export default function AppSidebar() {
  const pathname = usePathname();
  const roleKey =
    pathname.startsWith('/admin')
      ? 'admin'
      : pathname.startsWith('/teacher') || pathname.startsWith('/subjects')
        ? 'teacher'
        : 'student';
  const items = roleItems[roleKey] || roleItems.student;

  return (
    <aside className="dash-sidebar">
      <div className="dash-logo">
        <Icon.Spark />
      </div>
      {items.map((item) => {
        const IconComp = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            className={`icon-pill ${active ? 'active' : ''}`}
            href={item.href}
            aria-label={item.label}
            title={item.label}
          >
            <IconComp />
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-3">
        <Link className="icon-pill" href="/" aria-label="Home" title="Home">
          <Icon.Home />
        </Link>
      </div>
    </aside>
  );
}
