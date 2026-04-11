import Button from '@/components/primitives/Button';
import Title from '@/components/primitives/Title';

const SettingsPage = ({ onClose }) => (
  <section className="dq-layout-settings-page">
    <Title component="h3">Account settings</Title>
    <p>
      This settings page now uses the page variant of View and renders the header/title/close button correctly.
    </p>
    <Button onClick={onClose}>Close settings</Button>
  </section>
);

export default SettingsPage;
