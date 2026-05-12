import { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  DownloadSimpleIcon,
  GearSixIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Modal from '@/components/layout/Modal';
import Profile from '@/components/Profile';
import TribePanel from '@/components/TribePanel';
import Button from '@/components/primitives/Button';
import ChoiceButton from '@/components/primitives/ChoiceButton';
import { Switch } from '@/components/primitives/forms';
import { getRandomPresetAvatarIndex, resolveProfileAvatarUrl } from '@/lib/presetAvatars';
import { signOutCurrentUser, updateProfileAccount, validateUsername } from '@/lib/supabase';
import { activeSite } from '@/sites/siteDefinitions';
import './SettingsPage.css';

const ANDROID_APK_DOWNLOAD_PATHS_BY_SITE = {
  defqon1: '/apk/Defqon.1%20Companion.apk',
  insane: '/apk/Insane%20Companion.apk',
};

const isAndroidDevice = () => (
  typeof window !== 'undefined' &&
  /android/i.test(window.navigator.userAgent)
);

const getAndroidApkDownloadPath = () => (
  ANDROID_APK_DOWNLOAD_PATHS_BY_SITE[activeSite.slug] ?? null
);

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const SettingsPage = ({
  user,
  profile,
  tribe,
  isTribeBusy = false,
  isTribeHydrating = false,
  pendingTribeInviteCode = '',
  tribeInviteAlert = '',
  hidePastEvents,
  hideUndatedEvents,
  ignoreSmallConflicts,
  showStyleTags,
  favoriteCount = 0,
  lineups = [],
  selectedLineupKey,
  onSelectLineup,
  onHidePastEventsChange,
  onHideUndatedEventsChange,
  onIgnoreSmallConflictsChange,
  onShowStyleTagsChange,
  onResetFavorites,
  onProfileUpdated,
  onBeforeSignOut,
  onSignedOut,
  onCreateTribe,
  onJoinTribe,
  onLeaveTribe,
  onRenameTribe,
  tribeLocations = [],
  onShowMemberOnMap,
  pwaInstall = null,
  isAdmin = false,
  pendingLineupCount = 0,
  onOpenPage = null,
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [installMessage, setInstallMessage] = useState('');
  const [isInstallBusy, setIsInstallBusy] = useState(false);
  const [isResetFavoritesModalOpen, setIsResetFavoritesModalOpen] = useState(false);
  const [shouldShowAndroidApkDownload] = useState(isAndroidDevice);
  const tribeSectionRef = useRef(null);
  const androidApkDownloadPath = getAndroidApkDownloadPath();
  const selectableLineups = lineups.filter((lineup) => (
    lineup.status !== 'preview' && lineup.status !== 'temp'
  ));

  useEffect(() => {
    setErrorMessage('');
  }, [profile]);

  useEffect(() => {
    if (favoriteCount <= 0) {
      setIsResetFavoritesModalOpen(false);
    }
  }, [favoriteCount]);

  useEffect(() => {
    if (!user || (!pendingTribeInviteCode && !tribeInviteAlert)) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      tribeSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [pendingTribeInviteCode, tribeInviteAlert, user]);

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
      await onBeforeSignOut?.();
      await signOutCurrentUser();
      onSignedOut?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not sign out.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetFavorites = () => {
    if (favoriteCount <= 0) {
      return;
    }

    onResetFavorites?.();
    setIsResetFavoritesModalOpen(false);
  };

  const handleInstallApp = async () => {
    if (!pwaInstall?.canPromptInstall || isInstallBusy) {
      return;
    }

    setInstallMessage('');
    setIsInstallBusy(true);

    try {
      const result = await pwaInstall.promptInstall();
      setInstallMessage(
        result?.outcome === 'accepted'
          ? 'Installation started.'
          : 'Installation was not completed.'
      );
    } finally {
      setIsInstallBusy(false);
    }
  };

  const handleDownloadAndroidApk = () => {
    const downloadLink = document.createElement('a');

    if (!androidApkDownloadPath) {
      return;
    }

    downloadLink.href = androidApkDownloadPath;
    downloadLink.download = '';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  const installStatus = pwaInstall?.isInstalled
    ? 'Installed on this device.'
    : pwaInstall?.canPromptInstall
      ? 'Ready to install on this device.'
      : pwaInstall?.canInstallManually
        ? 'Use Share, then Add to Home Screen.'
        : 'Open this site from a supported browser to install it.';

  return (
    <Box className="dq-settings-page" gap="var(--dq-settings-page-gap)">
      <Box>
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
          actionContent={isAdmin ? (
            <Button
              onClick={() => onOpenPage?.('admin')}
              disabled={isBusy}
              badge={pendingLineupCount > 0 ? pendingLineupCount : null}
            >
              Admin panel
            </Button>
          ) : null}
        />
      </Box>

      <TribePanel
        ref={tribeSectionRef}
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
        tribeLocations={tribeLocations}
        onShowMemberOnMap={onShowMemberOnMap}
      />

      <Box background="surface" title="Install app" titleIcon={DownloadSimpleIcon}>
        <Box gap="var(--dq-ui-space-sm)">
          <p className="dq-settings-page__meta">
            {installStatus}
          </p>
          {installMessage ? (
            <p className="dq-settings-page__meta">
              {installMessage}
            </p>
          ) : null}
          <Box direction="row" justify="flex-start" wrap="wrap" gap="var(--dq-ui-space-sm)">
            <Button
              onClick={handleInstallApp}
              disabled={isInstallBusy || !pwaInstall?.canPromptInstall || pwaInstall?.isInstalled}
            >
              {pwaInstall?.isInstalled
                ? 'Installed'
                : isInstallBusy
                  ? 'Installing...'
                  : `Install ${activeSite.name}`}
            </Button>
            {shouldShowAndroidApkDownload && androidApkDownloadPath ? (
              <Button
                icon={DownloadSimpleIcon}
                onClick={handleDownloadAndroidApk}
              >
                Download Android APK
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box background="surface" title="App settings" titleIcon={GearSixIcon}>
        <Box gap="var(--dq-ui-space-lg)">
          {selectableLineups.length > 0 ? (
            <Box gap="var(--dq-ui-space-sm)">
              <strong>Line-up backup</strong>
              <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
                Switch temporarily between available snapshots.
              </p>
              <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
                {selectableLineups.map((lineup) => (
                  <ChoiceButton
                    key={lineup.key}
                    type="radio"
                    name="lineup-backup"
                    checked={lineup.key === selectedLineupKey}
                    onCheckedChange={() => onSelectLineup?.(lineup.key)}
                    selectedIcon={CheckIcon}
                    tag={lineup.isLatest ? 'Latest' : null}
                    size="lg"
                    subtitle={
                      lineup.lastPublishedAt
                        ? formatDateTime(lineup.lastPublishedAt)
                        : ''
                    }
                  >
                    {lineup.eventEditionName || lineup.label}
                  </ChoiceButton>
                ))}
              </Box>
            </Box>
          ) : null}

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
            label="Ignore small favorite conflicts"
            description="Ignore overlaps that are 25% or less of the shorter favorite set."
            checked={ignoreSmallConflicts}
            onCheckedChange={onIgnoreSmallConflictsChange}
          />

          <Switch
            label="Show style tags"
            description="Display compact style badges on artist cards."
            checked={showStyleTags}
            onCheckedChange={onShowStyleTagsChange}
          />

          <Box gap="var(--dq-ui-space-sm)">
            <strong>Favorites</strong>
            <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
              Reset all saved favorites attached to this account.
            </p>
            <Box direction="row" justify="flex-start" wrap="wrap" gap="var(--dq-ui-space-sm)">
              <Button
                variant="danger"
                onClick={() => setIsResetFavoritesModalOpen(true)}
                disabled={isBusy || favoriteCount <= 0}
              >
                Reset favorites ({favoriteCount})
              </Button>
            </Box>
          </Box>

          <Box direction="row" justify="flex-end">
            <Button variant="danger" onClick={handleSignOut} disabled={isBusy}>
              Sign out
            </Button>
          </Box>
        </Box>
      </Box>

      <Modal
        open={isResetFavoritesModalOpen}
        onClose={() => setIsResetFavoritesModalOpen(false)}
        title="Reset favorites?"
        subtitle="This will remove every saved favorite attached to your account."
        controls={(
          <>
            <Button
              variant="ghost"
              onClick={() => setIsResetFavoritesModalOpen(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleResetFavorites}
              disabled={isBusy || favoriteCount <= 0}
            >
              Reset favorites
            </Button>
          </>
        )}
      >
        <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
          You currently have {favoriteCount} saved favorite{favoriteCount === 1 ? '' : 's'}.
        </p>
      </Modal>
    </Box>
  );
};

export default SettingsPage;
