import Box from '@/components/layout/Box';
import useI18n from '@/hooks/useI18n';

const ROADMAP_ITEMS = [
  'Nothing planned...',
];

const RoadmapPage = () => {
  const { t } = useI18n();

  return (
    <Box>
    <p>
      {t('The roadmap stays focused on practical improvements that make the festival weekend easier to browse and easier to share.')}
    </p>

    <Box gap="var(--dq-ui-space-sm)">
      {ROADMAP_ITEMS.map((item) => (
        <Box key={item} background="surface">
          <p style={{ margin: 0 }}>{t(item)}</p>
        </Box>
      ))}
    </Box>
  </Box>
  );
};

export default RoadmapPage;
