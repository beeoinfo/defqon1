import Box from '@/components/layout/Box';
import Button from '@/components/primitives/Button';

const SettingsPage = ({ onOpenPage }) => (
  <>
    <p>
      This settings page now lives inside the stacked Page overlay system, so the base view stays mounted underneath.
    </p>
    <p>
      From here we can push more pages on top instead of replacing the current screen.
    </p>
    <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
      <Button onClick={() => onOpenPage?.('about')}>Open About</Button>
      <Button onClick={() => onOpenPage?.('roadmap')}>Open Roadmap</Button>
      <Button onClick={() => onOpenPage?.('legal')}>Open Legal</Button>
    </Box>
  </>
);

export default SettingsPage;
