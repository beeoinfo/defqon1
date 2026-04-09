import { useState } from 'react';
import { MapTrifoldIcon, MusicNoteIcon, MagnifyingGlassIcon, SparkleIcon, StarIcon, UsersIcon } from '@phosphor-icons/react';
import Alert from '../../components/Alert';
import BackToTopNow from '../../components/BackToTopNow';
import Box from '../../components/layout/Box';
import Element from '../../components/layout/Element';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/layout/Modal';
import Page from '../../components/layout/Page';
import View from '../../components/layout/View';
import Badge from '../../components/primitives/Badge';
import Button from '../../components/primitives/Button';
import ChoiceButton from '../../components/primitives/ChoiceButton';
import Dropdown, { DropdownDrawer } from '../../components/primitives/Dropdown';
import { CheckboxInput, FileInput, Switch, TextInput } from '../../components/primitives/forms';
import Tabs from '../../components/primitives/Tabs';
import Title from '../../components/primitives/Title';
import ToggleButton from '../../components/primitives/ToggleButton';
import UiThemeScope from '../../theme/UiThemeScope';
import './StorybookView.css';

const STORYBOOK_NAV_ITEMS = [
  {
    id: 'lineup',
    label: 'Line-up',
    icon: MusicNoteIcon,
    active: true,
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: MapTrifoldIcon,
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: StarIcon,
  },
  {
    id: 'tribe',
    label: 'Tribe',
    icon: UsersIcon,
  },
  {
    id: 'search',
    label: 'Search',
    icon: MagnifyingGlassIcon,
    mobileOnly: true,
  },
];

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
    titleIcon: SparkleIcon,
    titleVariant: 'h4',
    titleCount: 3,
    titleCountLabel: 'performers',
    elements: ['Box content', 'Extra content'],
  },
  {
    color: '#3842DA',
    title: 'Warm Spotlight',
    titleIcon: SparkleIcon,
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 5,
    titleCountLabel: 'items',
  },
  {
    color: '#A100FF',
    title: 'Ignored Icon',
    titleBadge: 'PURPLE',
    titleIcon: SparkleIcon,
    titleVariant: 'h4',
    titleCount: 6,
    titleCountLabel: 'artists',
    elements: ['Box content', 'Second element'],
  },
];

const STORYBOOK_MODAL_SCROLL_ITEMS = [
  'Friday warm-up picks',
  'Saturday blue stage clashes',
  'Sunday closing moments',
  'Legends set overlap',
  'Afterparty shortlist',
  'Must-see tribe picks',
  'Sunrise set reminders',
  'Backup stage route',
];

const STORYBOOK_FILTER_BAR_CHOICES = [
  {
    id: 'live',
    label: 'Live',
    color: '#22c55e',
  },
  {
    id: 'special',
    label: 'Special',
    color: '#bc9b5e',
  },
  {
    id: 'favorite',
    label: 'Favorite',
    icon: StarIcon,
    variant: 'favorite',
    fillOnPress: true,
  },
];

const STORYBOOK_FILTER_BAR_DRAWERS = [
  {
    id: 'stages',
    label: 'Stages',
    options: [
      {
        value: 'all',
        label: 'All stages',
        reset: true,
        defaultChecked: true,
      },
      {
        value: 'red',
        label: 'Red',
      },
      {
        value: 'blue',
        label: 'Blue',
        color: '#0BDBEF',
      },
      {
        value: 'gold',
        label: 'Gold',
        color: '#bc9b5e',
      },
    ],
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'checkbox',
    options: [
      {
        value: 'rawstyle',
        label: 'Rawstyle',
      },
      {
        value: 'uptempo',
        label: 'Uptempo',
      },
      {
        value: 'hardcore',
        label: 'Hardcore',
      },
    ],
  },
];

const STORYBOOK_FILTER_BAR_PLACEMENTS = [
  {
    value: 'top',
    label: 'Top',
  },
  {
    value: 'bottom',
    label: 'Bottom',
  },
];

const STORYBOOK_ALERT_EXAMPLES = [
  {
    variant: 'warning',
    title: 'Schedule conflict',
    message: 'Two saved sets now overlap on Blue and Gold. Pick a priority before doors open.',
  },
  {
    variant: 'info',
    title: 'Map sync available',
    message: 'The latest venue map is ready. Refresh your offline snapshot before you lose signal.',
  },
  {
    variant: 'success',
    title: 'Profile updated',
    message: 'Your tribe card, avatar and handle are now live across the app.',
  },
  {
    variant: 'error',
    title: 'Could not save favorites',
    message: 'The sync failed on the last attempt. Keep this tab open and retry once the connection settles.',
  },
  {
    variant: 'neutral',
    title: 'No results for these filters',
    message: 'Try clearing one tag, switching stage, or broadening the current time window.',
  },
];

const StorybookBoxExamples = ({ layout = 'flex' }) => {
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
};

const StorybookBody = () => {
  const [openModalDemo, setOpenModalDemo] = useState(null);
  const [filterBarPlacement, setFilterBarPlacement] = useState('top');
  const [filterBarHideOnScroll, setFilterBarHideOnScroll] = useState(true);

  return (
    <Box gap="var(--dq-ui-space-xxxl)">
      <FilterBar
        choices={STORYBOOK_FILTER_BAR_CHOICES}
        drawers={STORYBOOK_FILTER_BAR_DRAWERS}
        placement={filterBarPlacement}
        hideOnScroll={filterBarHideOnScroll}
      />

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
              <Button icon={SparkleIcon}>Icon Start</Button>
              <Button icon={SparkleIcon} iconPosition="end">
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
              <Button icon={SparkleIcon} ariaLabel="Sparkles small" size="sm" />
              <Button icon={SparkleIcon} ariaLabel="Sparkles medium" />
              <Button icon={SparkleIcon} ariaLabel="Sparkles large" size="lg" />
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
        title="Forms"
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
            title="Text Input"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <TextInput
                label="Username"
                placeholder="e.g. usera.testa"
                description="Lowercase letters, numbers, dots, underscores and dashes."
                autoComplete="username"
              />
              <TextInput
                label="Invite code"
                defaultValue="DEFQON-2026"
                successMessage="Invite code looks valid."
              />
              <TextInput
                label="Email"
                type="email"
                defaultValue="broken@email"
                errorMessage="Enter a valid email address."
                autoComplete="email"
              />
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Checkbox"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <CheckboxInput
                label="Receive tribe invites"
                description="Let trusted members send you direct join requests."
                defaultChecked
              />
              <CheckboxInput
                label="Allow public profile preview"
                description="Your avatar and handle can be previewed before someone opens your profile."
              />
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="File Input"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <FileInput
                label="Profile picture"
                description="Front-only for now. PNG, JPG or WEBP."
                accept="image/png,image/jpeg,image/webp"
              />
              <FileInput
                label="Supporting screenshots"
                description="Multiple files are allowed. The upload flow will come later."
                multiple
                accept="image/*"
              />
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Switch"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <Switch
                label="Hide past sets"
                description="Keep the line-up focused on what is still ahead."
                defaultChecked
              />
              <Switch
                label="Enable beta maps"
                description="Standalone switch for immediate settings, without any submit button."
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        title="Alerts"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
      >
        <Box gap="var(--dq-ui-space-lg)">
          {STORYBOOK_ALERT_EXAMPLES.map((example) => (
            <Alert
              key={example.variant}
              variant={example.variant}
              title={example.title}
            >
              {example.message}
            </Alert>
          ))}

          <Alert
            variant="info"
            title="App update available"
            actions={(
              <>
                <Button size="sm">
                  Later
                </Button>
                <Button size="sm">
                  Reload now
                </Button>
              </>
            )}
          >
            A fresh data bundle is waiting with the latest line-up corrections and tribe updates.
          </Alert>
        </Box>
      </Box>

      <Box
        component="section"
        title="Back To Top"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
      >
        <Element>
          Scroll the page: the floating back-to-top control appears after a real scroll threshold and stays pinned to the viewport with a single blur icon-button style.
        </Element>
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
                  <ToggleButton icon={SparkleIcon}>Notify me</ToggleButton>
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
                  <ToggleButton variant="favorite" icon={StarIcon} fillOnPress>Favorite</ToggleButton>
                  <ToggleButton variant="favorite" icon={UsersIcon} fillOnPress>
                    My Tribe
                  </ToggleButton>
                  <ToggleButton
                    variant="favorite"
                    icon={StarIcon}
                    fillOnPress
                    ariaLabel="Favorite"
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
                  <ChoiceButton variant="favorite" icon={UsersIcon} fillOnPress>
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
        title="Filter Bar"
        titleComponent="h2"
        titleVariant="h2"
        background="surface"
      >
        <Box gap="var(--dq-ui-space-lg)">
          <Element>Live floating demo of the real `FilterBar`. Switch placement here and scroll the page to verify `hideOnScroll` and the reset-button animation.</Element>
          <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
            {STORYBOOK_FILTER_BAR_PLACEMENTS.map((placementOption) => (
              <ChoiceButton
                key={placementOption.value}
                type="radio"
                name="storybook-filterbar-placement"
                checked={filterBarPlacement === placementOption.value}
                onCheckedChange={(isChecked) => {
                  if (isChecked) {
                    setFilterBarPlacement(placementOption.value);
                  }
                }}
              >
                {placementOption.label}
              </ChoiceButton>
            ))}
            <ChoiceButton
              checked={filterBarHideOnScroll}
              onCheckedChange={setFilterBarHideOnScroll}
            >
              Hide on scroll
            </ChoiceButton>
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
        title="Modal"
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
            <Box gap="var(--dq-ui-space-lg)">
              <Element>Header, close button, content area and bottom controls.</Element>
              <Box
                component="div"
                slot="content"
                direction="row"
                wrap="wrap"
                gap="var(--dq-ui-space-lg)"
              >
                <Button onClick={() => setOpenModalDemo('default')}>
                  Open default modal
                </Button>
              </Box>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Content Only"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <Element>Optional title removed, close button kept, no bottom controls.</Element>
              <Box
                component="div"
                slot="content"
                direction="row"
                wrap="wrap"
                gap="var(--dq-ui-space-lg)"
              >
                <Button onClick={() => setOpenModalDemo('minimal')}>
                  Open minimal modal
                </Button>
              </Box>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Scroll Locked"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <Element>Scrollable body with separators only when overflow exists, and no close on outside click.</Element>
              <Box
                component="div"
                slot="content"
                direction="row"
                wrap="wrap"
                gap="var(--dq-ui-space-lg)"
              >
                <Button onClick={() => setOpenModalDemo('wide')}>
                  Open locked modal
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        <Modal
          open={openModalDemo === 'default'}
          onClose={() => setOpenModalDemo(null)}
          title="Festival settings"
          subtitle="Reusable modal shell with optional header and bottom controls."
          controls={
            <>
              <Button onClick={() => setOpenModalDemo(null)}>
                Cancel
              </Button>
              <Button selected onClick={() => setOpenModalDemo(null)}>
                Save changes
              </Button>
            </>
          }
        >
          <Box gap="var(--dq-ui-space-lg)">
            <Element>Body content lives in the central slot and inherits the shared `surface-blur` shell.</Element>
            <Element>Use this shape for forms, confirmation flows and richer settings content.</Element>
          </Box>
        </Modal>

        <Modal
          open={openModalDemo === 'minimal'}
          onClose={() => setOpenModalDemo(null)}
          ariaLabel="Minimal modal example"
        >
          <Box gap="var(--dq-ui-space-lg)">
            <Element>This one shows the shell without title or controls.</Element>
            <Element>The close icon still gives a clean dismiss path when the header copy is optional.</Element>
          </Box>
        </Modal>

        <Modal
          open={openModalDemo === 'wide'}
          onClose={() => setOpenModalDemo(null)}
          title="Line-up comparison"
          subtitle="Outside click is disabled here, so use the close button or footer actions."
          closeOnOutsideClick={false}
          maxWidth="720px"
          controls={
            <>
              <Button onClick={() => setOpenModalDemo(null)}>
                Close
              </Button>
              <Button selected onClick={() => setOpenModalDemo(null)}>
                Compare artists
              </Button>
            </>
          }
        >
          <Box gap="var(--dq-ui-space-lg)">
            {STORYBOOK_MODAL_SCROLL_ITEMS.map((item) => (
              <Box key={item} background="surface">
                <Element>{item}</Element>
                <Element>Shared modal shell, scrollable body, and footer actions.</Element>
              </Box>
            ))}
          </Box>
        </Modal>
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
};

const StorybookView = ({ mode = 'view' }) => {
  const isPage = mode === 'page';

  return (
    <UiThemeScope>
      {isPage ? (
        <Page>
          <StorybookBody />
        </Page>
      ) : (
        <View
          navbar={STORYBOOK_NAV_ITEMS}
        >
          <StorybookBody />
        </View>
      )}
      <BackToTopNow />
    </UiThemeScope>
  );
};

export default StorybookView;
