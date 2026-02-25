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

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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

    const { data: publicData } =
      supabase.storage.from('avatars').getPublicUrl(filePath);

    const nextUrl = publicData?.publicUrl || '';
    if (!nextUrl) {
      setIsUploading(false);
      alert('Avatar URL oldsongui');
      return;
    }

    setAvatarUrl(nextUrl);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: nextUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setIsUploading(false);

    if (updateError) {
      alert(`Avatar хадгалах үед алдаа: ${updateError.message}`);
      return;
    }

    setProfile((prev) =>
      prev ? { ...prev, avatar_url: nextUrl } : prev
    );
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
    <div className="app-bg profile-page min-h-screen">
      <div className="dash-shell profile-shell">
        <AppSidebar />

        <main className="dash-main profile-main">
          
          {/* HEADER + Toggle баруун дээд */}
          <header className="dash-header profile-header fade-up flex items-start justify-between">
            
            {/* Зүүн талын мэдээлэл */}
            <div>
              <p className="profile-kicker text-xs uppercase tracking-[0.28em]">
                {t('profile')}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="profile-avatar-sm profile-floating-avatar shrink-0 overflow-hidden rounded-full border"
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    minHeight: 48,
                    maxWidth: 48,
                    maxHeight: 48,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="block"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted">
                      No avatar
                    </div>
                  )}
                </div>

                <h1 className="profile-title text-xl font-semibold md:text-[42px]">
                  {fullName || t('roleStudents')}
                </h1>
              </div>

              <p className="mt-3 text-sm text-[color:rgba(255,255,255,0.78)]">
                {t('activeStudent')}
              </p>
            </div>

            {/* 👉 ToggleGroup баруун дээд буланд */}
            <div className="profile-toggle-wrap">
              <ToggleGroup />
            </div>

          </header>

          {/* Content Section */}
          <section className="mt-2 grid gap-4 profile-grid fade-up delay-1 text-[color:var(--ink)]">
            
            <div className="soft-panel profile-panel profile-summary-panel">
              <h2 className="text-[34px] font-semibold leading-none">
                {t('summary')}
              </h2>

              <div className="mt-4 space-y-3 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(255,255,255,0.82)]">
                    {t('email')}
                  </span>
                  <span className="font-semibold text-white">
                    {email || '--'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(255,255,255,0.82)]">
                    {t('role')}
                  </span>
                  <span className="tag profile-role-tag">
                    {profile?.role || '--'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[color:rgba(255,255,255,0.82)]">
                    Phone
                  </span>
                  <span className="font-semibold text-white">
                    {phone || '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="soft-panel profile-panel overflow-hidden">
              <h2 className="text-[40px] font-semibold leading-none">
                Edit profile
              </h2>

              <div className="mt-4 grid gap-3">
                <div className="flex flex-wrap items-center gap-4 min-w-0">
                  <div
                    className="profile-avatar shrink-0 overflow-hidden rounded-full border"
                    style={{ width: 64, height: 64 }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="block"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted">
                        No avatar
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="input-field profile-input w-full max-w-full"
                    />
                  </div>
                </div>

                {isUploading && (
                  <p className="text-xs text-[color:rgba(255,255,255,0.75)]">
                    Avatar uploading...
                  </p>
                )}

                <input
                  className="input-field profile-input w-full max-w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullName')}
                />

                <input
                  className="input-field profile-input w-full max-w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                />

                <input
                  className="input-field profile-input w-full max-w-full"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Avatar URL"
                />

                <textarea
                  className="input-field profile-input w-full max-w-full"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={4}
                />

                <button
                  onClick={saveProfile}
                  className="btn-primary profile-save-btn"
                  disabled={isSaving || isUploading}
                >
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
