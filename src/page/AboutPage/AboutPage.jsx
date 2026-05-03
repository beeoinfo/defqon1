import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';

const AboutPage = () => (
  <Box gap="var(--dq-ui-space-xl)">
    <Alert variant="info" title="Built as a focused Defqon.1 companion">
      This app helps browse the line-up faster, save likes, spot schedule changes and share the weekend with a tribe.
    </Alert>

    <Box background="surface" title="Why it exists">
      <p>
        Built by Dylan Bergozza as a fan-made utility, this project aims to make festival data easier to read and more personal to use.
      </p>
      <p>
        The goal is not to replace the official experience, but to offer a calmer way to explore artists, compare slots and keep your own weekend organized.
      </p>
    </Box>
  </Box>
);

export default AboutPage;
