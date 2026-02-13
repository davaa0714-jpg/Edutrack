'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useI18n } from '@/lib/i18n';
import ToggleGroup from '@/app/components/ToggleGroup';
import AppSidebar from '@/app/components/AppSidebar';

export default function ProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      const userId = user?.id;
      if (!userId) return;

      setEmail(user?.email || '');

      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!data) return;

      const profileData = data as Profile;
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
      setAvatarUrl(profileData.avatar_url || '');
      setBio(profileData.bio || '');
    };
    load();
  }, []);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setIsUploading(true);

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setIsUploading(false);
      alert(`Avatar upload aldaa: ${uploadError.message}`);
      return;
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const nextUrl = publicData?.publicUrl || '';
    setAvatarUrl(nextUrl);
    setIsUploading(false);
  };

  const saveProfile = async () => {
    if (!profile?.id) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: fullName,
            phone,
            avatar_url: avatarUrl,
            bio,
          }
        : prev
    );
    alert('Profile shinechlegdlee');
  };

  return (
    <div className="app-bg">
      <div className="dash-shell">
        <AppSidebar />
        <main className="dash-main">
          <header className="dash-header fade-up">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">{t('profile')}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-[color:var(--glass-border)] bg-[color:var(--surface)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted">No avatar</div>
                  )}
                </div>
                <h1 className="text-2xl font-semibold">{fullName || t('roleStudents')}</h1>
              </div>
              <p className="mt-2 text-sm text-muted">{t('activeStudent')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup />
            </div>
          </header>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr] fade-up delay-1">
            <div className="soft-panel">
              <h2 className="text-sm font-semibold">{t('summary')}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('email')}</span>
                  <span className="font-semibold">{email || '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('role')}</span>
                  <span className="tag">{profile?.role || '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Phone</span>
                  <span className="font-semibold">{phone || '--'}</span>
                </div>
              </div>
            </div>

            <div className="soft-panel">
              <h2 className="text-sm font-semibold">Edit profile</h2>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-[color:var(--glass-border)] bg-[color:var(--surface)]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted">No avatar</div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="input-field" />
                </div>
                {isUploading && <p className="text-xs text-muted">Avatar uploading...</p>}
                <input
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullName')}
                />
                <input
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                />
                <input
                  className="input-field"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Avatar URL"
                />
                <textarea
                  className="input-field"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={4}
                />
                <button onClick={saveProfile} className="btn-primary" disabled={isSaving || isUploading}>
                  {isSaving ? 'Saving...' : t('save')}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
