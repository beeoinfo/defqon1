import { Sparkles, Users } from 'lucide-react';
import './StorybookView.css';
import Box from '../../components/layout/Box/index';
import Element from '../../components/layout/Element/index';
import Page from '../../components/layout/Page/index';
import Badge from '../../components/primitives/Badge/index';
import Button from '../../components/primitives/Button/index';
import ChoiceButton from '../../components/primitives/ChoiceButton/index';
import Dropdown, { DropdownDrawer } from '../../components/primitives/Dropdown/index';
import Tabs from '../../components/primitives/Tabs/index';
import ToggleButton from '../../components/primitives/ToggleButton/index';
import Title from '../../components/primitives/Title/index';
import UiThemeScope from '../../theme/UiThemeScope';
import View from '../../components/layout/View/index';

const STORYBOOK_BOX_EXAMPLES = [
  {
    color: '#0BDBEF',
    title: 'Line-up Preview',
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 4,
    titleCountLabel: 'items',
    elements: ['Box content', 'Second element'],
  },
  {
    color: '#FF008B',
    titleCount: 2,
    titleCountLabel: 'performers',
    content: 'Box without title',
  },
  {
    color: '#D492FF',
    titleBadge: 'U.V.',
    titleCount: 6,
    titleCountLabel: 'artists',
    elements: ['Box content', 'Second element', 'Third element'],
  },
  {
    color: '#B95511',
    title: 'Featured Stage',
    titleBadge: 'GOLD',
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 6,
    titleCountLabel: 'artists',
  },
  {
    color: '#00FF00',
    titleIcon: Sparkles,
    titleVariant: 'h4',
    titleCount: 3,
    titleCountLabel: 'performers',
    elements: ['Box content', 'Extra content'],
  },
  {
    color: '#3842DA',
    title: 'Warm Spotlight',
    titleIcon: Sparkles,
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 5,
    titleCountLabel: 'items',
  },
  {
    color: '#A100FF',
    title: 'Ignored Icon',
    titleBadge: 'PURPLE',
    titleIcon: Sparkles,
    titleVariant: 'h4',
    titleCount: 6,
    titleCountLabel: 'artists',
    elements: ['Box content', 'Second element'],
  },
];

function StorybookBoxExamples({ layout = 'flex' }) {
  const content = STORYBOOK_BOX_EXAMPLES.map(({
    content: exampleContent = 'Box content',
    elements,
    ...boxProps
  }, index) => (
    <Box
      key={`${boxProps.title ?? 'untitled'}-${boxProps.titleCount}-${index}`}
      background="surface"
      {...boxProps}
    >
      {elements ? (
        elements.map((element) => <Element key={element}>{element}</Element>)
      ) : (
        <Element>{exampleContent}</Element>
      )}
    </Box>
  ));

  if (layout === 'columns') {
    return (
      <Box layout="columns" maxColumns={4} gap="var(--dq-ui-space-xxxl)">
        {content}
      </Box>
    );
  }

  return (
    <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-xxxl)" maxColumns={4}>
      {content}
    </Box>
  );
}

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
            title="Color"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button color="#0BDBEF">Blue</Button>
              <Button color="#FF008B">Magenta</Button>
              <Button color="#00FF00">Green</Button>
              <Button color="#F1E300">Yellow</Button>
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

      <Box
        component="section"
        title="Boxes"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
        titleCount={12}
        titleCountLabel="performers"
      >
        <StorybookBoxExamples />
      </Box>

      <Box
        component="section"
        title="Boxes Columns"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
        titleCount={12}
        titleCountLabel="performers"
      >
        <StorybookBoxExamples layout="columns" />
      </Box>

      <Box
        component="section"
        title="Toggle Buttons"
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
            title="Toggle"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <Box gap="var(--dq-ui-space-sm)">
                <Title component="span" variant="h6">
                  Ghost
                </Title>
                <Box
                  className="dq-ui-storybook__buttons"
                  direction="row"
                  wrap="wrap"
                  gap="var(--dq-ui-space-lg)"
                >
                  <ToggleButton>Subscribed</ToggleButton>
                  <ToggleButton icon={Sparkles}>Notify me</ToggleButton>
                </Box>
              </Box>

              <Box gap="var(--dq-ui-space-sm)">
                <Title component="span" variant="h6">
                  Favorite
                </Title>
                <Box
                  className="dq-ui-storybook__buttons"
                  direction="row"
                  wrap="wrap"
                  gap="var(--dq-ui-space-lg)"
                >
                  <ToggleButton variant="favorite">Favorite</ToggleButton>
                  <ToggleButton variant="favorite" icon={Users}>
                    My Tribe
                  </ToggleButton>
                  <ToggleButton
                    variant="favorite"
                    icon={Sparkles}
                    ariaLabel="Favorite sparkles"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Choice"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <Box gap="var(--dq-ui-space-sm)">
                <Title component="span" variant="h6">
                  Checkbox
                </Title>
                <Box
                  className="dq-ui-storybook__buttons"
                  direction="row"
                  wrap="wrap"
                  gap="var(--dq-ui-space-lg)"
                >
                  <ChoiceButton defaultChecked>Camping</ChoiceButton>
                  <ChoiceButton>Parking</ChoiceButton>
                  <ChoiceButton color="#00FF00" radius="rounded">
                    Green
                  </ChoiceButton>
                  <ChoiceButton variant="favorite" icon={Users}>
                    My Tribe
                  </ChoiceButton>
                </Box>
              </Box>

              <Box gap="var(--dq-ui-space-sm)">
                <Title component="span" variant="h6">
                  Radio
                </Title>
                <Box
                  className="dq-ui-storybook__buttons"
                  direction="row"
                  wrap="wrap"
                  gap="var(--dq-ui-space-lg)"
                >
                  <ChoiceButton type="radio" name="storybook-filter" defaultChecked>
                    All
                  </ChoiceButton>
                  <ChoiceButton type="radio" name="storybook-filter" color="#0BDBEF" radius="rounded" defaultChecked>
                    Blue
                  </ChoiceButton>
                  <ChoiceButton type="radio" name="storybook-filter" color="#FF008B" radius="rounded">
                    Magenta
                  </ChoiceButton>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        title="Dropdowns"
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
            title="Default"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Dropdown label="Stages">
                <Element>Line-up</Element>
                <Element>Favorites</Element>
                <Element>My tribe</Element>
              </Dropdown>
              <Dropdown label="Blue" color="#0BDBEF" radius="rounded">
                <Element>Blue stage</Element>
                <Element>6 artists</Element>
              </Dropdown>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Placements"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Dropdown label="Bottom">
                <Element>bottom</Element>
              </Dropdown>
              <Dropdown label="Top" placement="top">
                <Element>top</Element>
              </Dropdown>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Drawer"
            titleComponent="h3"
            titleVariant="h4"
          >
            <DropdownDrawer
              items={[
                {
                  value: 'lineup',
                  label: 'Line-up',
                  content: (
                    <Box background="surface">
                      <Element>Line-up panel</Element>
                    </Box>
                  ),
                },
                {
                  value: 'tribe',
                  label: 'Tribe',
                  content: (
                    <Box background="surface">
                      <Element>Tribe panel</Element>
                    </Box>
                  ),
                },
                {
                  value: 'favorites',
                  label: 'Favorites',
                  content: (
                    <Box background="surface">
                      <Element>Favorites panel</Element>
                    </Box>
                  ),
                },
              ]}
            />
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        title="Tabs"
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
          >
            <Tabs
              ariaLabel="Storybook tabs"
              items={[
                {
                  value: 'lineup',
                  label: 'Line-up',
                  content: (
                    <Box background="surface">
                      <Element>Line-up panel</Element>
                    </Box>
                  ),
                },
                {
                  value: 'tribe',
                  label: 'Tribe',
                  content: (
                    <Box background="surface">
                      <Element>Tribe panel</Element>
                    </Box>
                  ),
                },
                {
                  value: 'favorites',
                  label: 'Favorites',
                  content: (
                    <Box background="surface">
                      <Element>Favorites panel</Element>
                    </Box>
                  ),
                },
              ]}
            />
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        title="Badges"
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
            title="Count"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Button badge={3}>Inbox</Button>
              <Button badge={12}>Alerts</Button>
            </Box>
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Badge variant="title">1</Badge>
              <Badge variant="title">12</Badge>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Pills"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Badge>DEFAULT</Badge>
              <Badge color="#22c55e">Live</Badge>
              <Badge variant="plain">
                PLAIN
              </Badge>
              <Badge variant="plain" color="#ca2323">
                Hotfix
              </Badge>
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
