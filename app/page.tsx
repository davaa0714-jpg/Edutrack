'use client';
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import ToggleGroup from "@/app/components/ToggleGroup";

export default function Home() {
  const { t } = useI18n();
  const stats = [
    { label: t('averageScore'), value: '92%', note: t('last30Days') },
    { label: t('attendanceRate'), value: '98%', note: t('updatedNow') },
    { label: t('realtimeSync'), value: '24/7', note: t('live') },
  ];
  const highlights = [
    { title: t('overview'), status: t('updatedNow') },
    { title: t('grades'), status: t('pending') },
    { title: t('attendance'), status: t('updatedNow') },
    { title: t('reports'), status: t('updatedNow') },
  ];
  return (
    <div className="min-h-screen app-bg">
      <div className="mx-auto max-w-[980px] px-6 py-12">
        <header className="flex flex-col gap-5 items-start fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{t('appName')}</span>
            <span className="chip">{t('today')}</span>
            <span className="chip">{t('overview')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup />
            <Link href="/login" className="btn-secondary">
              {t('login')}
            </Link>
            <Link href="/register" className="btn-primary">
              {t('register')}
            </Link>
          </div>
        </header>

        <section className="mt-8 fade-up delay-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted">{t('overview')}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            {t('homeTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">{t('homeSubtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/register" className="btn-primary">
              {t('createAccount')}
            </Link>
            <Link href="/login" className="btn-secondary">
              {t('goLogin')}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill">{t('roleStudents')}</span>
            <span className="pill">{t('roleTeachers')}</span>
            <span className="pill">{t('roleAdmins')}</span>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3 fade-up delay-2">
          {stats.map((stat) => (
            <div key={stat.label} className="soft-panel">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted">{stat.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2 fade-up delay-3">
          <div className="soft-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t('todayHighlights')}</h2>
              <span className="pill">{t('live')}</span>
            </div>
            <div className="mt-3 space-y-2">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-3 py-2"
                >
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="pill">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="soft-panel">
            <h2 className="text-sm font-semibold">{t('builtForEveryRole')}</h2>
            <p className="text-sm text-muted">{t('builtForEveryRoleDesc')}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[t('dashboard'), t('grades'), t('attendance'), t('reports')].map((item) => (
                <div key={item} className="border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-3 py-2">
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="text-xs text-muted">{t('instantUpdates')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
