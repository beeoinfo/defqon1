import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, X } from 'lucide-react';
import {
  getRandomPresetAvatarIndex,
  resolveProfileAvatarUrl,
} from '../lib/presetAvatars';
import {
  signOutCurrentUser,
  updateProfileAccount,
  validateUsername,
} from '../lib/supabase';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp';

export default function ProfileModal({
  open,
  user,
  profile,
  onClose,
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

  const initialFirstName = profile?.first_name ?? '';
  const initialLastName = profile?.last_name ?? '';
  const initialUsername = profile?.username ?? '';
  const initialAvatarMode = profile?.avatar_kind ?? 'preset';
  const initialAvatarPreset = profile?.avatar_preset ?? 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setUsername(profile?.username ?? '');
    setAvatarFile(null);
    setAvatarMode(profile?.avatar_kind ?? 'preset');
    setAvatarPreset(profile?.avatar_preset ?? 1);
    setErrorMessage('');
  }, [open, profile]);

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

  if (!open || !user) {
    return null;
  }

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

    if (!ACCEPTED_TYPES.split(',').includes(file.type)) {
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
      onClose?.();
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
      onClose?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not sign out.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-panel__header">
          <div>
            <h2>Profile</h2>
            <p className="muted">Update your details and avatar.</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="profile-avatar-editor">
            <div className="profile-avatar-editor__preview-wrap">
              <div className="profile-avatar-editor__preview">
                <img src={previewUrl} alt="Avatar preview" />
              </div>

              <button
                type="button"
                className="profile-avatar-refresh-badge"
                onClick={handleRegeneratePreset}
                title="Pick another default avatar"
                aria-label="Pick another default avatar"
              >
                <RefreshCcw size={14} />
              </button>
            </div>

            <div className="profile-avatar-editor__content">
              <label className="button-secondary profile-avatar-upload">
                <span>Import image</span>
                <input
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleAvatarChange}
                  hidden
                />
              </label>
            </div>
          </div>

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

          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>

          {errorMessage && <div className="form-error">{errorMessage}</div>}

          <div className="modal-actions modal-actions--spread">
            <button
              type="button"
              className="button-danger"
              onClick={handleSignOut}
              disabled={isBusy}
            >
              Sign out
            </button>

            <div className="modal-actions__right">
              <button
                type="submit"
                className="button-primary"
                disabled={isBusy || !hasChanges}
              >
                {isBusy ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}