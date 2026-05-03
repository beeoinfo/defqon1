import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';

const LegalPage = () => (
  <Box gap="var(--dq-ui-space-xl)">
    <Alert variant="warning" title="Fan-made utility">
      This interface is not an official Defqon.1 or Q-dance product.
    </Alert>

    <Box background="surface" title="Data used by the app">
      <p>
        Account data is limited to the information needed to power the experience: profile details, tribe membership and favorite snapshots.
      </p>
      <p>
        The app is designed to keep those flows understandable and tied to explicit user actions like signing in, editing a profile, saving favorites or joining a tribe.
      </p>
    </Box>
  </Box>
);

export default LegalPage;
