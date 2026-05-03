import Box from '@/components/layout/Box';

const ROADMAP_ITEMS = [
  '🔄️ Live lineup updates checker.',
  '👆 Interactive maps action.',
  '🎵 Filters by musical styles.',
  '🚀 Complete PWA support with offline mode and push notifications.',
];

const RoadmapPage = () => (
  <Box>
    <p>
      The roadmap stays focused on practical improvements that make the festival weekend easier to browse and easier to share.
    </p>

    <Box gap="var(--dq-ui-space-sm)">
      {ROADMAP_ITEMS.map((item) => (
        <Box key={item} background="surface">
          <p style={{ margin: 0 }}>{item}</p>
        </Box>
      ))}
    </Box>
  </Box>
);

export default RoadmapPage;
