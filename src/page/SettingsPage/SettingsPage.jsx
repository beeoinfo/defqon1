import { useEffect, useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Profile from '@/components/Profile';
import Button from '@/components/primitives/Button';
import ChoiceButton from '@/components/primitives/ChoiceButton';
import { Switch } from '@/components/primitives/forms';
import { getRandomPresetAvatarIndex, resolveProfileAvatarUrl } from '@/lib/presetAvatars';
import { signOutCurrentUser, updateProfileAccount, validateUsername } from '@/lib/supabase';
import TribeView from '@/views/TribeView';
import './SettingsPage.css';

const SettingsPage = ({
  user,
  profile,
  tribe,
  isTribeBusy = false,
  isTribeHydrating = false,
  pendingTribeInviteCode = '',
  tribeInviteAlert = '',
  betaFeaturesEnabled,
  hidePastEvents,
  hideUndatedEvents,
  lineups = [],
  selectedLineupKey,
  onSelectLineup,
  onBetaFeaturesEnabledChange,
  onHidePastEventsChange,
  onHideUndatedEventsChange,
  onProfileUpdated,
  onSignedOut,
  onCreateTribe,
  onJoinTribe,
  onLeaveTribe,
  onRenameTribe,
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
  }, [profile]);

  if (!user) {
    return (
      <Alert variant="neutral" title="Sign in required">
        Log in to manage your synced profile, saved snapshots and app preferences.
      </Alert>
    );
  }

  const handleProfileSave = async ({
    firstName,
    lastName,
    username,
    avatarMode,
    avatarPreset,
    avatarFile,
  }) => {
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
    } catch (error) {
      setErrorMessage(error.message || 'Could not update the profile.');
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);

    try {
      await signOutCurrentUser();
      onSignedOut?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not sign out.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Box className="dq-settings-page" gap="var(--dq-settings-page-gap)">
      <Profile
        firstName={profile?.first_name ?? ''}
        lastName={profile?.last_name ?? ''}
        username={profile?.username ?? ''}
        avatarSrc={resolveProfileAvatarUrl(profile)}
        avatarMode={profile?.avatar_kind ?? 'preset'}
        avatarPreset={profile?.avatar_preset ?? 1}
        isBusy={isBusy}
        errorMessage={errorMessage}
        onCancel={() => setErrorMessage('')}
        onChangePreset={(currentPreset) => {
          const nextPreset = getRandomPresetAvatarIndex(currentPreset);

          return {
            avatarPreset: nextPreset,
            avatarSrc: resolveProfileAvatarUrl({
              avatar_kind: 'preset',
              avatar_preset: nextPreset,
            }),
          };
        }}
        onSave={handleProfileSave}
      />

      <TribeView
        user={user}
        tribe={tribe}
        isBusy={isTribeBusy}
        isHydrating={isTribeHydrating}
        pendingInviteCode={pendingTribeInviteCode}
        inviteConflictMessage={tribeInviteAlert}
        onCreateTribe={onCreateTribe}
        onJoinTribe={onJoinTribe}
        onLeaveTribe={onLeaveTribe}
        onRenameTribe={onRenameTribe}
      />

      <Box background="surface" title="App settings">
        <Box gap="var(--dq-ui-space-lg)">
          <Box gap="var(--dq-ui-space-sm)">
            <strong>Line-up backup</strong>
            <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
              Switch temporarily between available snapshots.
            </p>
            <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
              {lineups.map((lineup) => (
                <ChoiceButton
                  key={lineup.key}
                  type="radio"
                  name="lineup-backup"
                  checked={lineup.key === selectedLineupKey}
                  onCheckedChange={() => onSelectLineup?.(lineup.key)}
                  selectedIcon={CheckIcon}
                  tag={lineup.isLatest ? 'Latest' : null}
                >
                  {lineup.label}
                </ChoiceButton>
              ))}
            </Box>
          </Box>

          <Switch
            label="Hide past events"
            description="Keep the line-up focused on what is still ahead."
            checked={hidePastEvents}
            onCheckedChange={onHidePastEventsChange}
          />

          <Switch
            label="Hide events without date"
            description="Hide entries that still do not have a confirmed timeslot."
            checked={hideUndatedEvents}
            onCheckedChange={onHideUndatedEventsChange}
          />

          <Switch
            label="Enable beta features"
            description="Unlock map browsing and other in-progress extras."
            checked={betaFeaturesEnabled}
            onCheckedChange={onBetaFeaturesEnabledChange}
          />

          <Box direction="row" justify="flex-end">
            <Button variant="danger" onClick={handleSignOut} disabled={isBusy}>
              Sign out
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
