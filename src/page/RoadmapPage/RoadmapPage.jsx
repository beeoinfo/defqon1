import Box from '@/components/layout/Box';

const ROADMAP_ITEMS = [
  'Smarter recommendations between favorites and tribe activity.',
  'Cleaner mobile flows for search, filters and review management.',
  'More account settings and better archive browsing for older line-ups.',
];

const RoadmapPage = () => (
  <Box background="surface" title="What comes next">
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
