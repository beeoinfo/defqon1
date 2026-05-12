import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Button from '@/components/primitives/Button';
import useI18n from '@/hooks/useI18n';

const ABOUT_FEATURES = [
  {
    title: 'Lineup browsing',
    text: 'Explore artists, stages, days and time slots with filters that stay close to the way the festival is actually planned.',
  },
  {
    title: 'Favorites and reviews',
    text: 'Save sets, review changes between snapshots and spot timetable conflicts before they turn into last-minute choices.',
  },
  {
    title: 'Tribe sharing',
    text: 'See what your group likes, compare plans and keep the weekend easier to coordinate without turning it into admin work.',
  },
];

const ABOUT_PRINCIPLES = [
  'Keep the interface fast to scan on mobile during the festival.',
  'Make saved favorites portable across Lineup updates where possible.',
  'Show conflicts and missing data clearly instead of hiding uncertainty.',
  'Stay fan-made, focused and separate from the official festival experience.',
];

const AboutPage = ({ onOpenPage }) => {
  const { t } = useI18n();

  return (
    <Box gap="var(--dq-ui-space-xl)">
      <Alert variant="info" title={t('Built as a focused Defqon.1 companion')}>
        {t('A fan-made planning app for browsing the Lineup, saving favorites, reviewing updates and coordinating with a tribe.')}
    </Alert>

    <Box background="surface" title={t('What this app is')}>
      <p>
        {t('This project is a personal festival utility built by Dylan B. for people who want a calmer, more practical way to prepare their Defqon.1 weekend.')}
      </p>
      <p>
        {t('It is not meant to replace official channels. It exists to make the schedule easier to compare, the saved sets easier to maintain and the group planning easier to read at a glance.')}
      </p>
    </Box>

    <Box background="surface" title={t('What it helps with')}>
      <Box layout="columns" maxColumns={3} gap="var(--dq-ui-space-md)">
        {ABOUT_FEATURES.map((feature) => (
          <Box key={feature.title} background="none" gap="var(--dq-ui-space-xs)">
            <strong>{t(feature.title)}</strong>
            <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
              {t(feature.text)}
            </p>
          </Box>
        ))}
      </Box>
    </Box>

    <Box background="surface" title={t('Product principles')}>
      <Box component="ul" gap="var(--dq-ui-space-sm)" style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
        {ABOUT_PRINCIPLES.map((principle) => (
          <li key={principle}>{t(principle)}</li>
        ))}
      </Box>
    </Box>

    <Box background="surface" title={t('Independence')}>
      <p>
        {t('This app is independent, unofficial and fan-made. Festival names, stage names, artist names and related references belong to their respective owners.')}
      </p>
      <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
        <Button onClick={() => onOpenPage?.('roadmap')}>
          {t('View roadmap')}
        </Button>
        <Button variant="ghost" onClick={() => onOpenPage?.('legal')}>
          {t('Legal details')}
        </Button>
      </Box>
    </Box>
  </Box>
  );
};

export default AboutPage;
