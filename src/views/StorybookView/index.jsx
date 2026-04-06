import { Sparkles } from 'lucide-react';
import './StorybookView.css';
import Box from '../../components/layout/Box/index';
import Element from '../../components/layout/Element/index';
import Page from '../../components/layout/Page/index';
import Button from '../../components/primitives/Button/index';
import Title from '../../components/primitives/Title/index';
import UiThemeScope from '../../theme/UiThemeScope';
import View from '../../components/layout/View/index';

function StorybookBody() {
  return (
    <Box gap="var(--dq-ui-space-xxxl)">
      <Box
        component="section"
        title="Titles"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
      >
        <Box
          className="dq-ui-storybook__titles"
          direction="row"
          wrap="wrap"
          align="flex-start"
          gap="var(--dq-ui-space-xxxl)"
        >
          <Box className="dq-ui-storybook__title-column" gap="var(--dq-ui-space-xl)">
            <Title component="h1">Heading H1</Title>
            <Title component="h2">Heading H2</Title>
            <Title component="h3">Heading H3</Title>
            <Title component="h4">Heading H4</Title>
            <Title component="h5">Heading H5</Title>
            <Title component="h6">Heading H6</Title>
          </Box>
          <Box className="dq-ui-storybook__title-column" gap="var(--dq-ui-space-xl)">
            <Title component="span" variant="h1">
              Span styled as H1
            </Title>
            <Title component="span" variant="h2">
              Span styled as H2
            </Title>
            <Title component="span" variant="h3">
              Span styled as H3
            </Title>
            <Title component="span" variant="h4">
              Span styled as H4
            </Title>
            <Title component="span" variant="h5">
              Span styled as H5
            </Title>
            <Title component="span" variant="h6">
              Span styled as H6
            </Title>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        title="Buttons"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
      >
        <Box
          className="dq-ui-storybook__button-sections"
          direction="row"
          wrap="wrap"
          align="stretch"
          gap="var(--dq-ui-space-xxxl)"
        >
          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Sizes"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Radius"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button radius="md">Radius md</Button>
              <Button radius="rounded">Radius rounded</Button>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Variants"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button>Ghost</Button>
              <Button variant="danger">Danger</Button>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="With Icon"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button icon={Sparkles}>Icon Start</Button>
              <Button icon={Sparkles} iconPosition="end">
                Icon End
              </Button>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Icon Only"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button icon={Sparkles} ariaLabel="Sparkles small" size="sm" />
              <Button icon={Sparkles} ariaLabel="Sparkles medium" />
              <Button icon={Sparkles} ariaLabel="Sparkles large" size="lg" />
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Rich Large"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button
                size="lg"
                radius="rounded"
                imageSrc="/src/assets/avatars/1.png"
                imageAlt=""
                subtitle="@test"
              >
                Usera Testa
              </Button>
              <Button size="lg" variant="danger" subtitle="Danger zone">
                Leave Tribe
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function StorybookView({ mode = 'view' }) {
  const isPage = mode === 'page';

  return (
    <UiThemeScope>
      {isPage ? (
        <Page>
          <StorybookBody />
        </Page>
      ) : (
        <View
          navbar={
            <Element>Navbar</Element>
          }
        >
          <StorybookBody />
        </View>
      )}
    </UiThemeScope>
  );
}
