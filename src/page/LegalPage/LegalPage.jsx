import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import useI18n from '@/hooks/useI18n';

const DATA_ITEMS = [
  {
    title: 'Account profile',
    text: 'When you sign in, the app stores the profile fields needed to show your name, username and avatar inside the experience.',
  },
  {
    title: 'Favorites',
    text: 'Favorite snapshots are saved so your selected sets can be restored, reviewed and matched against newer Lineup data.',
  },
  {
    title: 'Tribe activity',
    text: 'Tribe membership and shared favorite references are used to show what your group is planning around.',
  },
];

const LegalPage = () => {
  const { t } = useI18n();

  return (
    <Box gap="var(--dq-ui-space-xl)">
      <Alert variant="warning" title={t('Fan-made utility')}>
        {t('This app is independent and is not an official Defqon.1, Q-dance or festival organizer product.')}
    </Alert>

    <Box background="surface" title={t('Unofficial status')}>
      <p>
        {t('This interface is provided as a fan-made companion for planning and reviewing a festival schedule. It does not represent, speak for or replace any official organizer, ticketing provider, safety channel or festival communication.')}
      </p>
      <p>
        {t('Always rely on official sources for final Lineup announcements, timetable changes, access rules, safety information, travel updates and event conditions.')}
      </p>
    </Box>

    <Box background="surface" title={t('Data handled by the app')}>
      <Box layout="columns" maxColumns={3} gap="var(--dq-ui-space-md)">
        {DATA_ITEMS.map((item) => (
          <Box key={item.title} background="none" gap="var(--dq-ui-space-xs)">
            <strong>{t(item.title)}</strong>
            <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
              {t(item.text)}
            </p>
          </Box>
        ))}
      </Box>
    </Box>

    <Box background="surface" title={t('User control')}>
      <p>
        {t('Account actions are tied to explicit user choices: signing in, editing a profile, saving or resetting favorites, joining or leaving a tribe and switching app preferences.')}
      </p>
      <p>
        {t('The settings page includes controls for profile changes, tribe membership, Lineup snapshots and saved favorites.')}
      </p>
    </Box>

    <Box background="surface" title={t('Content and trademarks')}>
      <p>
        {t('Artist names, stage names, festival names, brand names, logos and other references may be trademarks or protected material owned by their respective rights holders.')}
      </p>
      <p>
        {t('Any schedule or Lineup information shown in the app is provided for convenience and may be incomplete, delayed or different from official information.')}
      </p>
    </Box>

    <Box background="surface" title={t('Liability')}>
      <p>
        {t('The app is provided as-is for personal planning. It should not be used as the sole source for decisions that depend on official timing, access, safety or travel information.')}
      </p>
    </Box>
  </Box>
  );
};

export default LegalPage;
