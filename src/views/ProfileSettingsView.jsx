import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCcw, X } from 'lucide-react';
import { getRandomPresetAvatarIndex, resolveProfileAvatarUrl } from '../lib/presetAvatars';
import { signOutCurrentUser, updateProfileAccount, validateUsername } from '../lib/supabase';

const INFO_PAGES = {
  about: {
    title: 'About',
    eyebrow: 'Who made this',
    body: [
      'Built by Dylan Bergozza as a focused companion for browsing the Defqon.1 line-up, saving favourites and reviewing schedule changes.',
      'The goal is simple: make the festival data easier to read, faster to search and more personal with tribe features and account sync.',
    ],
  },
  roadmap: {
    title: 'Roadmap',
    eyebrow: 'What comes next',
    body: [
      'Smarter recommendations between favourites and tribe activity.',
      'Even cleaner mobile flows for search, filters and review management.',
      'More account settings and better archive browsing for older line-ups.',
    ],
  },
  legal: {
    title: 'Legal',
    eyebrow: 'Small print',
    body: [
      'This interface is a fan-made utility experience and is not an official Defqon.1 product.',
      'Account data is limited to profile information, tribe membership and favourites needed to power the app experience.',
    ],
  },
};

function InfoPage({ pageKey, onClose }) {
  const page = INFO_PAGES[pageKey];

  if (!page) {
    return null;
  }

  return (
    <>
      <header className="profile-settings__sticky-header">
        <div className="profile-settings__sticky-shell profile-settings__sticky-shell--info">
          <div className="profile-settings__sticky-inner">
          <div className="profile-settings__sticky-copy">
            <span className="profile-settings__eyebrow">{page.eyebrow}</span>
            <h1 className="profile-settings__title">{page.title}</h1>
          </div>
          <button
            type="button"
            className="profile-settings__close"
            onClick={onClose}
            aria-label="Close page"
          >
            <X size={18} />
          </button>
        </div>
        </div>
      </header>
      <main className="page page--profile-settings">
        <section className="profile-settings profile-settings--info">
          <div className="profile-settings__body">
            <section className="profile-settings__panel profile-settings__panel--text">
              {page.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

export default function ProfileSettingsView({
  user,
  profile,
  hidePastEvents,
  hideUndatedEvents,
  lineups,
  selectedLineupKey,
  onSelectLineup,
  onBack,
  onHidePastEventsChange,
  onHideUndatedEventsChange,
  onProfileUpdated,
  onSignedOut,
}) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarMode, setAvatarMode] = useState(profile?.avatar_kind ?? 'preset');
  const [avatarPreset, setAvatarPreset] = useState(profile?.avatar_preset ?? 1);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const initialFirstName = profile?.first_name ?? '';
  const initialLastName = profile?.last_name ?? '';
  const initialUsername = profile?.username ?? '';
  const initialAvatarMode = profile?.avatar_kind ?? 'preset';
  const initialAvatarPreset = profile?.avatar_preset ?? 1;

  useEffect(() => {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setUsername(profile?.username ?? '');
    setAvatarFile(null);
    setAvatarMode(profile?.avatar_kind ?? 'preset');
    setAvatarPreset(profile?.avatar_preset ?? 1);
    setErrorMessage('');
    setShowEditor(false);
  }, [profile]);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return resolveProfileAvatarUrl({
      avatar_kind: avatarMode,
      avatar_preset: avatarPreset,
      avatar_url: avatarMode === 'upload' ? profile?.avatar_url : null,
    });
  }, [avatarFile, avatarMode, avatarPreset, profile?.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarFile && previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [avatarFile, previewUrl]);

  if (!user) {
    return null;
  }

  if (activeInfoPage) {
    return (
      <InfoPage pageKey={activeInfoPage} onClose={() => setActiveInfoPage(null)} />
    );
  }

  const displayFirstName = firstName.trim() || profile?.first_name || 'First';
  const displayLastName = lastName.trim() || profile?.last_name || 'Last';
  const displayUsername = username.trim() || profile?.username || 'username';

  const hasChanges =
    firstName.trim() !== initialFirstName.trim() ||
    lastName.trim() !== initialLastName.trim() ||
    username.trim().toLowerCase() !== initialUsername.trim().toLowerCase() ||
    Boolean(avatarFile) ||
    avatarMode !== initialAvatarMode ||
    avatarPreset !== initialAvatarPreset;

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Avatar must be a JPEG, PNG, GIF or WEBP file.');
      return;
    }
    setErrorMessage('');
    setAvatarMode('upload');
    setAvatarFile(file);
  };

  const handleRegeneratePreset = () => {
    setErrorMessage('');
    setAvatarFile(null);
    setAvatarMode('preset');
    setAvatarPreset((currentPreset) => getRandomPresetAvatarIndex(currentPreset));
  };

  const handleCancelChanges = () => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setUsername(initialUsername);
    setAvatarFile(null);
    setAvatarMode(initialAvatarMode);
    setAvatarPreset(initialAvatarPreset);
    setErrorMessage('');
    setShowEditor(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required.');
      return;
    }
    if (!validateUsername(username)) {
      setErrorMessage(
        'Username must contain 3 to 30 characters: lowercase letters, numbers, dot, underscore or dash.'
      );
      return;
    }
    if (!hasChanges) {
      setShowEditor(false);
      return;
    }
    setIsBusy(true);
    try {
      const nextProfile = await updateProfileAccount({
        userId: user.id,
        currentProfile: profile,
        firstName,
        lastName,
        username,
        avatarMode,
        avatarPreset,
        avatarFile,
      });
      onProfileUpdated?.(nextProfile);
      setShowEditor(false);
    } catch (error) {
      setErrorMessage(error.message || 'Could not update the profile.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    try {
      await signOutCurrentUser();
      onSignedOut?.();
      onBack?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not sign out.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="profile-settings-page">
      <header className="profile-settings__sticky-header">
        <div className="profile-settings__sticky-shell">
          <div className="profile-settings__sticky-inner">
            <div className="profile-settings__sticky-copy">
              <h1 className="profile-settings__title">Profile Settings</h1>
            </div>
            <button
              type="button"
              className="profile-settings__close"
              onClick={onBack}
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="page page--profile-settings">
        <section className="profile-settings">
          <div className="profile-settings__body">
            <section className="profile-settings__hero">
              <div className="profile-settings__avatar-shell">
                <div className="profile-settings__avatar">
                  <img src={previewUrl} alt="Avatar preview" />
                </div>
                <button
                  type="button"
                  className="profile-settings__avatar-refresh"
                  onClick={handleRegeneratePreset}
                  title="Pick another default avatar"
                  aria-label="Pick another default avatar"
                >
                  <RefreshCcw size={15} />
                </button>
              </div>

              <div className="profile-settings__identity">
                <h2>
                  {displayFirstName} {displayLastName}
                </h2>
                <p>@{displayUsername}</p>
              </div>

              <div className="profile-settings__hero-actions">
                {!showEditor && hasChanges ? (
                  <div className="profile-settings__hero-actions-group">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={handleCancelChanges}
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="profile-settings-form"
                      className="button-primary"
                      disabled={isBusy || !hasChanges}
                    >
                      {isBusy ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                ) : !showEditor ? (
                  <button
                    type="button"
                    className="profile-settings__edit"
                    onClick={() => setShowEditor(true)}
                  >
                    Edit profile
                  </button>
                ) : null}
              </div>
            </section>

        {showEditor && (
          <section className="profile-settings__panel profile-settings__panel--editor">
            <form id="profile-settings-form" className="profile-settings__form" onSubmit={handleSubmit}>
              <div className="profile-settings__form-grid">
                <label className="field">
                  <span>First name</span>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                  />
                </label>
                <label className="field field--full">
                  <span>Username</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label className="field field--full">
                  <span>Avatar upload</span>
                  <input
                    id="profile-avatar-input"
                    className="profile-settings__file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <div className="profile-settings__file-row">
                    <label htmlFor="profile-avatar-input" className="profile-settings__file-button">
                      Choose file
                    </label>
                    <span className="profile-settings__file-name">
                      {avatarFile?.name ?? 'No file selected'}
                    </span>
                  </div>
                </label>
              </div>

              {errorMessage && <div className="form-error">{errorMessage}</div>}

              <div className="profile-settings__form-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCancelChanges}
                  disabled={isBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={isBusy || !hasChanges}>
                  {isBusy ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="profile-settings__section">
          <div className="profile-settings__section-head">
            <h2>Settings</h2>
          </div>

          <div className="profile-settings__setting-block">
            <div className="profile-settings__setting-copy">
              <h3>Line-up backup</h3>
              <p>Switch temporarily between available snapshots.</p>
            </div>
            <div className="profile-settings__lineups">
              {lineups.map((lineup) => {
                const isSelected = lineup.key === selectedLineupKey;
                return (
                  <button
                    key={lineup.key}
                    type="button"
                    className={
                      isSelected
                        ? 'profile-settings__lineup-card profile-settings__lineup-card--active'
                        : 'profile-settings__lineup-card'
                    }
                    onClick={() => onSelectLineup(lineup.key)}
                  >
                    <div className="profile-settings__lineup-copy">
                      <strong>{lineup.label}</strong>
                      {lineup.isLatest && (
                        <span className="profile-settings__lineup-badge">Latest</span>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="profile-settings__lineup-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="profile-settings__setting-row">
            <div className="profile-settings__setting-copy">
              <h3>Hide past events</h3>
            </div>
            <label className="settings-toggle__label">
              <input
                type="checkbox"
                checked={hidePastEvents}
                onChange={(event) => onHidePastEventsChange?.(event.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>

          <div className="profile-settings__setting-row">
            <div className="profile-settings__setting-copy">
              <h3>Hide events without date</h3>
            </div>
            <label className="settings-toggle__label">
              <input
                type="checkbox"
                checked={hideUndatedEvents}
                onChange={(event) => onHideUndatedEventsChange?.(event.target.checked)}
              />
              <span className="settings-toggle__slider"></span>
            </label>
          </div>

          <button type="button" className="profile-settings__signout" onClick={handleSignOut}>
            Sign out
          </button>
        </section>

          </div>
        </section>
      </main>
      <footer className="profile-settings__footer-shell">
        <div className="profile-settings__footer">
          <p>
            Made with 🩷 by <strong>Dylan Bergozza</strong>
          </p>
          <p className="profile-settings__footer-meta">
            <em>v0.2α</em>
          </p>
          <div className="profile-settings__links">
            <button type="button" onClick={() => setActiveInfoPage('about')}>
              About
            </button>
            <button type="button" onClick={() => setActiveInfoPage('roadmap')}>
              Roadmap
            </button>
            <button type="button" onClick={() => setActiveInfoPage('legal')}>
              Legal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
