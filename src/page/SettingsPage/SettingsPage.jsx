import { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  DownloadSimpleIcon,
  GearSixIcon,
} from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Modal from '@/components/layout/Modal';
import Profile from '@/components/Profile';
import TribePanel from '@/components/TribePanel';
import Button from '@/components/primitives/Button';
import ChoiceButton from '@/components/primitives/ChoiceButton';
import { Switch } from '@/components/primitives/forms';
import useI18n from '@/hooks/useI18n';
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

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

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
  language = activeSite.defaultLanguage,
  onLanguageChange,
  onOpenPage = null,
}) => {
  const { t } = useI18n();
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
  const [languageErrorMessage, setLanguageErrorMessage] = useState('');

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
      <Alert variant="neutral" title={t('Sign in required')}>
        {t('Log in to manage your synced profile, saved snapshots and app preferences.')}
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
      setErrorMessage(t('First name and last name are required.'));
      return;
    }

    if (!validateUsername(username)) {
      setErrorMessage(
        t('Username must contain 3 to 30 characters: lowercase letters, numbers, dot, underscore or dash.')
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
      setErrorMessage(error.message || t('Could not update the profile.'));
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
      setErrorMessage(error.message || t('Could not sign out.'));
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
          ? t('Installation started.')
          : t('Installation was not completed.')
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
    ? t('Installed on this device.')
    : pwaInstall?.canPromptInstall
      ? t('Ready to install on this device.')
      : pwaInstall?.canInstallManually
        ? t('Use Share, then Add to Home Screen.')
        : t('Open this site from a supported browser to install it.');
  const handleLanguageSelect = async (nextLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    setLanguageErrorMessage('');
    setIsBusy(true);

    try {
      await onLanguageChange?.(nextLanguage);
    } catch (error) {
      setLanguageErrorMessage(error.message || t('Could not update language.'));
    } finally {
      setIsBusy(false);
    }
  };

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
              {t('Admin panel')}
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

      <Box background="surface" title={t('Install app')} titleIcon={DownloadSimpleIcon}>
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
                ? t('Installed')
                : isInstallBusy
                  ? t('Installing...')
                  : t('Install {siteName}', { siteName: activeSite.name })}
            </Button>
            {shouldShowAndroidApkDownload && androidApkDownloadPath ? (
              <Button
                icon={DownloadSimpleIcon}
                onClick={handleDownloadAndroidApk}
              >
                {t('Download Android APK')}
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box background="surface" title={t('Language')}>
        <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
          {LANGUAGE_OPTIONS.map((languageOption) => (
            <ChoiceButton
              key={languageOption.value}
              type="radio"
              name="language"
              checked={language === languageOption.value}
              onCheckedChange={() => handleLanguageSelect(languageOption.value)}
              disabled={isBusy}
              className="dq-settings-page__language-choice"
            >
              <span className="dq-settings-page__language-flag" aria-hidden="true">
                {languageOption.flag}
              </span>
              <span>{t(languageOption.label)}</span>
            </ChoiceButton>
          ))}
        </Box>
        {languageErrorMessage ? (
          <Alert variant="error" title={t('Language update failed')}>
            {languageErrorMessage}
          </Alert>
        ) : null}
      </Box>

      <Box background="surface" title={t('App settings')} titleIcon={GearSixIcon}>
        <Box gap="var(--dq-ui-space-lg)">
          {selectableLineups.length > 0 ? (
            <Box gap="var(--dq-ui-space-sm)">
              <strong>{t('Lineup backup')}</strong>
              <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
                {t('Switch temporarily between available snapshots.')}
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
                    tag={lineup.isLatest ? t('Latest') : null}
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
            label={t('Hide past events')}
            description={t('Keep the lineup focused on what is still ahead.')}
            checked={hidePastEvents}
            onCheckedChange={onHidePastEventsChange}
          />

          <Switch
            label={t('Hide events without date')}
            description={t('Hide entries that still do not have a confirmed timeslot.')}
            checked={hideUndatedEvents}
            onCheckedChange={onHideUndatedEventsChange}
          />

          <Switch
            label={t('Ignore small favorite conflicts')}
            description={t('Ignore overlaps that are 25% or less of the shorter favorite set.')}
            checked={ignoreSmallConflicts}
            onCheckedChange={onIgnoreSmallConflictsChange}
          />

          <Switch
            label={t('Show style tags')}
            description={t('Display compact style badges on artist cards.')}
            checked={showStyleTags}
            onCheckedChange={onShowStyleTagsChange}
          />

          <Box gap="var(--dq-ui-space-sm)">
            <strong>{t('Favorites')}</strong>
            <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
              {t('Reset all saved favorites attached to this account.')}
            </p>
            <Box direction="row" justify="flex-start" wrap="wrap" gap="var(--dq-ui-space-sm)">
              <Button
                variant="danger"
                onClick={() => setIsResetFavoritesModalOpen(true)}
                disabled={isBusy || favoriteCount <= 0}
              >
                {t('Reset favorites')} ({favoriteCount})
              </Button>
            </Box>
          </Box>

          <Box direction="row" justify="flex-end">
            <Button variant="danger" onClick={handleSignOut} disabled={isBusy}>
              {t('Sign out')}
            </Button>
          </Box>
        </Box>
      </Box>

      <Modal
        open={isResetFavoritesModalOpen}
        onClose={() => setIsResetFavoritesModalOpen(false)}
        title={t('Reset favorites?')}
        subtitle={t('This will remove every saved favorite attached to your account.')}
        controls={(
          <>
            <Button
              variant="ghost"
              onClick={() => setIsResetFavoritesModalOpen(false)}
              disabled={isBusy}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleResetFavorites}
              disabled={isBusy || favoriteCount <= 0}
            >
              {t('Reset favorites')}
            </Button>
          </>
        )}
      >
        <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
          {t('You currently have {count} saved favorite{plural}.', {
            count: favoriteCount,
            plural: favoriteCount === 1 ? '' : 's',
          })}
        </p>
      </Modal>
    </Box>
  );
};

export default SettingsPage;
