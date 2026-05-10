import { useEffect, useMemo, useState } from 'react';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import useCachedImageUrl from '@/hooks/useCachedImageUrl';
import Box from '../layout/Box';
import Button from '../primitives/Button';
import { FileInput, TextInput } from '../primitives/forms';
import './Profile.css';

const getDisplayName = (firstName, lastName) => (
  [firstName, lastName].filter(Boolean).join(' ').trim() || 'Your profile'
);

const Profile = ({
  firstName = '',
  lastName = '',
  username = '',
  avatarSrc = '',
  avatarMode = 'preset',
  avatarPreset = 1,
  avatarAlt = '',
  isBusy = false,
  errorMessage = '',
  actionContent = null,
  onChangePreset,
  onSave,
  onCancel,
  className = '',
}) => {
  const [savedProfile, setSavedProfile] = useState(() => ({
    firstName,
    lastName,
    username,
    avatarSrc,
    avatarMode,
    avatarPreset,
  }));
  const [draftFirstName, setDraftFirstName] = useState(savedProfile.firstName);
  const [draftLastName, setDraftLastName] = useState(savedProfile.lastName);
  const [draftUsername, setDraftUsername] = useState(savedProfile.username);
  const [draftAvatarSrc, setDraftAvatarSrc] = useState(savedProfile.avatarSrc);
  const [draftAvatarMode, setDraftAvatarMode] = useState(savedProfile.avatarMode);
  const [draftAvatarPreset, setDraftAvatarPreset] = useState(savedProfile.avatarPreset);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasPresetChange, setHasPresetChange] = useState(false);

  const displayName = getDisplayName(savedProfile.firstName, savedProfile.lastName);
  const displayUsername = String(savedProfile.username).trim() || 'username';
  const resolvedAvatarAlt = avatarAlt || displayName;
  const cachedDraftAvatarSrc = useCachedImageUrl(draftAvatarSrc);
  const hasFormChanges = useMemo(() => (
    draftFirstName !== savedProfile.firstName ||
    draftLastName !== savedProfile.lastName ||
    draftUsername !== savedProfile.username ||
    draftAvatarSrc !== savedProfile.avatarSrc ||
    draftAvatarMode !== savedProfile.avatarMode ||
    draftAvatarPreset !== savedProfile.avatarPreset ||
    Boolean(avatarFile)
  ), [
    avatarFile,
    draftAvatarSrc,
    draftAvatarMode,
    draftAvatarPreset,
    draftFirstName,
    draftLastName,
    draftUsername,
    savedProfile,
  ]);

  useEffect(() => {
    const nextProfile = {
      firstName,
      lastName,
      username,
      avatarSrc,
      avatarMode,
      avatarPreset,
    };

    setSavedProfile(nextProfile);
    setDraftFirstName(nextProfile.firstName);
    setDraftLastName(nextProfile.lastName);
    setDraftUsername(nextProfile.username);
    setDraftAvatarSrc(nextProfile.avatarSrc);
    setDraftAvatarMode(nextProfile.avatarMode);
    setDraftAvatarPreset(nextProfile.avatarPreset);
    setAvatarFile(null);
    setHasPresetChange(false);
    setIsEditing(false);
  }, [avatarMode, avatarPreset, avatarSrc, firstName, lastName, username]);

  const resetDraft = () => {
    setDraftFirstName(savedProfile.firstName);
    setDraftLastName(savedProfile.lastName);
    setDraftUsername(savedProfile.username);
    setDraftAvatarSrc(savedProfile.avatarSrc);
    setDraftAvatarMode(savedProfile.avatarMode);
    setDraftAvatarPreset(savedProfile.avatarPreset);
    setAvatarFile(null);
    setHasPresetChange(false);
  };

  const handlePresetChange = () => {
    const nextPreset = onChangePreset?.(draftAvatarPreset);
    const nextAvatarSrc = typeof nextPreset === 'string' ? nextPreset : nextPreset?.avatarSrc;
    const nextAvatarPreset = typeof nextPreset === 'object' ? nextPreset.avatarPreset : undefined;

    if (nextAvatarSrc) {
      setDraftAvatarSrc(nextAvatarSrc);
    }

    if (nextAvatarPreset) {
      setDraftAvatarPreset(nextAvatarPreset);
    }

    setDraftAvatarMode('preset');
    setAvatarFile(null);

    if (!isEditing) {
      setHasPresetChange(true);
    }
  };

  const handleCancel = () => {
    resetDraft();
    setIsEditing(false);
    onCancel?.();
  };

  const handleSave = async (event) => {
    event?.preventDefault?.();

    const nextProfile = {
      firstName: draftFirstName,
      lastName: draftLastName,
      username: draftUsername,
      avatarSrc: draftAvatarSrc,
      avatarMode: draftAvatarMode,
      avatarPreset: draftAvatarPreset,
      avatarFile,
    };

    await onSave?.(nextProfile);
    setSavedProfile({
      firstName: nextProfile.firstName,
      lastName: nextProfile.lastName,
      username: nextProfile.username,
      avatarSrc: nextProfile.avatarSrc,
      avatarMode: nextProfile.avatarMode,
      avatarPreset: nextProfile.avatarPreset,
    });

    setAvatarFile(null);
    setHasPresetChange(false);
    setIsEditing(false);
  };

  const handleAvatarFilesChange = (files) => {
    const nextFile = files?.[0] ?? null;

    setAvatarFile(nextFile);

    if (nextFile) {
      setDraftAvatarMode('upload');
      setDraftAvatarSrc(URL.createObjectURL(nextFile));
    }
  };

  return (
    <Box className={['dq-profile', className].filter(Boolean).join(' ')} align="center">
      <Box className="dq-profile__summary" align="center" gap="var(--dq-ui-space-lg)">
        <Box component="span" slot="content" className="dq-profile__avatar-shell">
          {cachedDraftAvatarSrc ? (
            <img src={cachedDraftAvatarSrc} alt={resolvedAvatarAlt} className="dq-profile__avatar" />
          ) : null}
          <Button
            className="dq-profile__avatar-action"
            icon={ArrowCounterClockwiseIcon}
            size="sm"
            radius="rounded"
            ariaLabel="Change preset avatar"
            title="Change preset avatar"
            onClick={handlePresetChange}
          />
        </Box>

        <Box align="center" gap="var(--dq-ui-space-xs)">
          <strong className="dq-profile__name">{displayName}</strong>
          <span className="dq-profile__username">@{displayUsername}</span>
        </Box>
      </Box>

      <Box className="dq-profile__form-zone" align="center">
        {!isEditing && !hasPresetChange ? (
          <Box className="dq-profile__actions" direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)" justify="center">
            <Button onClick={() => setIsEditing(true)}>
              Edit profile
            </Button>
            {actionContent}
          </Box>
        ) : null}

        {!isEditing && hasPresetChange ? (
          <Box className="dq-profile__actions" direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)" justify="center">
            <Button onClick={handleCancel} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy || !hasFormChanges}>
              {isBusy ? 'Saving...' : 'Save changes'}
            </Button>
          </Box>
        ) : null}

        {isEditing ? (
          <Box
            component="form"
            background="surface"
            className="dq-profile__editor"
            gap="var(--dq-ui-space-lg)"
            onSubmit={handleSave}
          >
            <Box direction="row" wrap="wrap" maxColumns={2}>
              <TextInput
                label="First name"
                value={draftFirstName}
                onChange={(event) => setDraftFirstName(event.target.value)}
                autoComplete="given-name"
                required
              />
              <TextInput
                label="Last name"
                value={draftLastName}
                onChange={(event) => setDraftLastName(event.target.value)}
                autoComplete="family-name"
                required
              />
            </Box>

            <TextInput
              label="Username"
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              autoComplete="username"
              description="Lowercase letters, numbers, dots, underscores and dashes."
              required
            />

            <FileInput
              label="Avatar upload"
              description="PNG, JPG, GIF or WEBP."
              accept="image/png,image/jpeg,image/gif,image/webp"
              onFilesChange={handleAvatarFilesChange}
            />

            {errorMessage ? (
              <p className="dq-profile__error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Box direction="row" justify="flex-end" wrap="wrap" gap="var(--dq-ui-space-sm)">
              <Button onClick={handleCancel} disabled={isBusy}>
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy || !hasFormChanges}>
                {isBusy ? 'Saving...' : 'Save changes'}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default Profile;
