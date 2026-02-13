'use client';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageToggle from '@/app/components/LanguageToggle';

export default function ToggleGroup() {
  return (
    <div className="toggle-group">
      <ThemeToggle />
      <LanguageToggle />
    </div>
  );
}
