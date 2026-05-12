import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, HeartIcon, SparkleIcon, StarIcon, UsersIcon } from '@phosphor-icons/react';
import Alert from '../../components/Alert';
import BackToTop from '../../components/BackToTop';
import Box from '../../components/layout/Box';
import Card from '@/components/primitives/Card';
import Drawer from '../../components/layout/Drawer';
import Element from '../../components/layout/Element';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/layout/Modal';
import Page from '../../components/layout/Page';
import SlidingColumns from '../../components/layout/SlidingColumns';
import PeopleCard from '../../components/PeopleCard';
import Profile from '../../components/Profile';
import useAnimatedPageStack from '@/hooks/useAnimatedPageStack';
import useDocumentScrollLock from '@/hooks/useDocumentScrollLock';
import View from '@/components/layout/View';
import {
  getHistoryPageStack,
  pushHistoryPageStackState,
  replaceHistoryPageStackState,
  syncPageStackIdRef,
} from '@/lib/pageHistory';
import {
  getNextPageStackOnClose,
  getNextPageStackOnOpen,
} from '@/lib/pageStack';
import { PAGE_DEFINITIONS } from '@/page/pageDefinitions';
import { resolveRoute } from '@/routes/AppRoutes';
import Badge from '@/components/primitives/Badge';
import Button from '../../components/primitives/Button';
import ChoiceButton from '../../components/primitives/ChoiceButton';
import Dropdown, { DropdownDrawer } from '../../components/primitives/Dropdown';
import { CheckboxInput, DateTimeInput, FileInput, SearchInput, SelectInput, Switch, TextInput } from '../../components/primitives/forms';
import PeopleStack from '@/components/PeopleStack';
import Tabs from '../../components/primitives/Tabs';
import Title from '../../components/primitives/Title';
import ToggleButton from '../../components/primitives/ToggleButton';
import UiThemeScope from '../../theme/UiThemeScope';
import { getPresetAvatarUrl, getRandomPresetAvatarIndex, presetAvatarOptions } from '@/lib/presetAvatars';
import { activeSite } from '@/sites/siteDefinitions';
import './StorybookView.css';

const STORYBOOK_PRIMARY_COLOR = activeSite.theme.primary;

const STORYBOOK_BOX_EXAMPLES = [
  {
    title: 'No Background',
    titleComponent: 'h3',
    titleVariant: 'h4',
    noBackground: true,
    cards: [
      { title: 'Default Card', meta1: 'RED', meta2: 'Friday', meta3: '22:00 – 23:00' },
    ],
  },
  {
    title: 'Card in Card – No Parent',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Outer Card', meta1: 'RED', meta2: 'Friday', meta3: '22:00 – 23:00', description: 'Card with sub-card, no parent color.', subCard: { title: 'Inner Card', meta1: 'RED', meta2: 'Friday', meta3: '23:00 – 00:00' } },
    ],
  },
  {
    title: 'Card in Card – Colored Sub',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Outer Card', meta1: 'BLUE', meta2: 'Saturday', meta3: '14:00 – 15:00', subCard: { color: '#0BDBEF', title: 'Blue Sub', meta1: 'BLUE', meta2: 'Saturday', meta3: '15:00 – 16:00' } },
    ],
  },
  {
    color: '#0BDBEF',
    title: 'Inherited Blue',
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 2,
    titleCountLabel: 'artists',
    cards: [
      { title: 'Wildstylez', meta1: 'BLUE', meta2: 'Saturday', meta3: '14:00 – 15:00' },
      { title: 'Headhunterz', meta1: 'BLUE', meta2: 'Friday', meta3: '22:00 – 23:00', actionVariant: 'favorite' },
    ],
  },
  {
    color: '#FF008B',
    title: 'Inherited Magenta',
    titleComponent: 'h3',
    titleVariant: 'h4',
    titleCount: 1,
    titleCountLabel: 'performer',
    cards: [
      { title: 'D-Block & S-te-Fan', meta1: 'MAGENTA', meta2: 'Saturday', meta3: '18:00 – 19:00', description: 'Euphoric duo known for delivering anthem after anthem.' },
    ],
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
    title: 'Inherited Gold + Close',
    titleBadge: 'GOLD',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Ran-D', meta1: 'GOLD', meta2: 'Friday', meta3: '23:00 – 00:00', actionVariant: 'close' },
    ],
  },
  {
    color: '#0BDBEF',
    title: 'Inherited Sub – Blue',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Wildstylez', meta1: 'BLUE', meta2: 'Saturday', meta3: '14:00 – 15:00', description: 'Inherited card with inherited sub-card.', subCard: { title: 'Bass Modulators', meta1: 'BLUE', meta2: 'Saturday', meta3: '15:00 – 16:00' } },
    ],
  },
  {
    color: '#00FF00',
    title: 'Inherited Sub – Green',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Ran-D', meta1: 'GREEN', meta2: 'Friday', meta3: '23:00 – 00:00', actionVariant: 'favorite', subCard: { title: 'Aftershock', meta1: 'GREEN', meta2: 'Saturday', meta3: '00:00 – 01:00' } },
    ],
  },
  {
    color: '#00FF00',
    title: 'Color on Color – Green',
    titleIcon: SparkleIcon,
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Ran-D', meta1: 'GREEN', meta2: 'Friday', meta3: '23:00 – 00:00', description: 'Raw hardstyle legend closing the Friday stage.', actionVariant: 'favorite', subCard: { color: '#0BDBEF', title: 'Blue Sub on Green', meta1: 'BLUE', meta2: 'Saturday', meta3: '00:00 – 01:00' } },
    ],
  },
  {
    color: '#FF008B',
    title: 'Color on Color – Magenta',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Main Magenta', meta1: 'MAGENTA', meta2: 'Saturday', meta3: '20:00 – 21:00', subCard: { color: '#0BDBEF', title: 'Blue Sub on Magenta', meta1: 'BLUE', meta2: 'Sunday', meta3: '01:00 – 02:00' } },
    ],
  },
  {
    color: '#A100FF',
    title: 'Color on Color – Purple',
    titleBadge: 'PURPLE',
    titleComponent: 'h3',
    titleVariant: 'h4',
    cards: [
      { title: 'Sub Zero Project', meta1: 'PURPLE', meta2: 'Sunday', meta3: '20:00 – 21:00', actionVariant: 'favorite', subCard: { color: '#00FF00', title: 'Green Sub on Purple', meta1: 'GREEN', meta2: 'Sunday', meta3: '22:00 – 23:00' } },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#0BDBEF', title: 'Headhunterz', metaVariant: 'strikethrough', meta1: 'BLUE', meta2: 'Saturday', meta3: '22:00 – 23:00', actionVariant: 'close', subCard: { color: '#F1E300', title: 'Headhunterz', meta1: 'YELLOW', meta2: 'Saturday', meta3: '16:00 – 17:00' } },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#FF008B', title: 'D-Block & S-te-Fan', metaVariant: 'strikethrough', meta1: 'MAGENTA', meta2: 'Saturday', meta3: '18:00 – 19:00', actionVariant: 'close', subCard: { color: '#00FF00', title: 'D-Block & S-te-Fan', meta1: 'GREEN', meta2: 'Sunday', meta3: '20:00 – 21:00' } },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#B95511', title: 'Ran-D', metaVariant: 'strikethrough', meta1: 'GOLD', meta2: 'Friday', meta3: '23:00 – 00:00', actionVariant: 'close', subCard: { color: '#A100FF', title: 'Ran-D', meta1: 'PURPLE', meta2: 'Saturday', meta3: '15:00 – 16:00' } },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#00FF00', title: 'Aftershock', metaVariant: 'strikethrough', meta1: 'GREEN', meta2: 'Saturday', meta3: '00:00 – 01:00', description: 'No longer in the lineup.', error: true, actionVariant: 'close' },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#0BDBEF', title: 'Zatox', metaVariant: 'strikethrough', meta1: 'BLUE', meta2: 'Saturday', meta3: '16:00 – 17:00', description: 'No longer in the lineup.', error: true, actionVariant: 'close' },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#FF008B', title: 'Noisecontrollers', metaVariant: 'strikethrough', meta1: 'MAGENTA', meta2: 'Saturday', meta3: '19:00 – 20:00', description: 'No longer in the lineup.', error: true, actionVariant: 'close' },
    ],
  },
  {
    noBackground: true,
    cards: [
      { color: '#A100FF', title: 'Warface', metaVariant: 'strikethrough', meta1: 'PURPLE', meta2: 'Sunday', meta3: '21:00 – 22:00', description: 'No longer in the lineup.', error: true, actionVariant: 'close' },
    ],
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

const STORYBOOK_DRAWER_SCROLL_ITEMS = [
  'Lineup filters',
  'Live now',
  'Favorites only',
  'Red stage',
  'Blue stage',
  'Black stage',
  'Hardstyle peak',
  'Raw crossover',
  'Night session',
  'Afterparty plan',
  'Food break',
  'Camp route',
  'Merch stop',
  'Closing set',
];

const STORYBOOK_SLIDING_COLUMNS_SECTIONS = [
  {
    id: 'friday',
    label: 'Friday',
    color: STORYBOOK_PRIMARY_COLOR,
    intro: 'Short opening column to test early hide states and skipped next targets.',
    items: [
      'Opening ceremony',
      'Locker access plan',
      'Friends arrival sync',
      'Dinner slot check',
    ],
  },
  {
    id: 'saturday',
    label: 'Saturday',
    color: '#38bdf8',
    intro: 'Tall dense column so the rail still has a living target after shorter neighbors are already passed.',
    items: [
      'Peak crowd flow',
      'Favorite clashes',
      'Raw after dark',
      'Food break window',
      'Merch stop timing',
      'Night session plan',
      'Purple stage backup',
      'Taxi estimate note',
      'Blue route fallback',
      'Crew meetup note',
      'Power bank check',
      'Rain gear backup',
      'Late bus timing',
    ],
  },
  {
    id: 'sunday',
    label: 'Sunday',
    color: '#22c55e',
    intro: 'Very short column so it should get skipped once its own section has already been passed.',
    items: [
      'Closing run',
      'Last map check',
      'Back home shortlist',
    ],
  },
  {
    id: 'weekend',
    label: 'Weekend',
    color: '#a855f7',
    intro: 'Extra tall catch-all column to validate long-range skip logic in both directions.',
    items: [
      'Must-see shortlist',
      'Fallback plan',
      'Rain gear note',
      'Power bank check',
      'Camping route',
      'Transport reminder',
      'Hydration reminder',
      'Emergency contact note',
      'Camp wake-up reminder',
      'Food budget note',
      'Locker backup code',
      'Night exit route',
      'Taxi meeting point',
      'Photo spot reminder',
      'Water refill note',
      'Phone charge plan',
    ],
  },
];

const renderStorybookSlidingColumnContent = (section, keyPrefix = '') => (
  <Box gap="var(--dq-ui-space-lg)">
    <Element>{section.intro}</Element>
    {section.items.map((item) => (
      <Element key={`${keyPrefix}${section.id}-${item}`}>{item}</Element>
    ))}
  </Box>
);

const STORYBOOK_FILTER_BAR_CHOICES = [
  {
    id: 'live',
    label: 'Live',
    color: '#22c55e',
  },
  {
    id: 'special',
    label: 'Special',
    color: STORYBOOK_PRIMARY_COLOR,
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
        color: STORYBOOK_PRIMARY_COLOR,
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

const STORYBOOK_PEOPLE_STACK_AVATARS = presetAvatarOptions.map((avatar) => ({
  id: `member-${avatar.index}`,
  avatarUrl: avatar.url,
}));

const STORYBOOK_DROPDOWN_DRAWER_ITEMS = [
  {
    value: 'lineup',
    label: 'Lineup',
    content: (
      <Box background="surface">
        <Element>Lineup panel</Element>
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
];

const STORYBOOK_TABS_ITEMS = [
  {
    value: 'lineup',
    label: 'Lineup',
    content: (
      <Box background="surface">
        <Element>Lineup panel</Element>
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
];

const StorybookBoxExamples = memo(({ layout = 'flex' }) => {
  const content = STORYBOOK_BOX_EXAMPLES.map(({
    content: exampleContent = 'Box content',
    elements,
    cards,
    noBackground,
    ...boxProps
  }, index) => (
    <Box
      key={`${boxProps.title ?? 'untitled'}-${boxProps.titleCount}-${index}`}
      background={noBackground ? 'none' : 'surface'}
      {...boxProps}
    >
      {cards ? (
        cards.map((cardDef) => {
          const { subCard, ...cardProps } = cardDef;
          return (
            <Card key={cardDef.title} {...cardProps}>
              {subCard ? (
                <Card component="div" titleComponent="h4" {...subCard} />
              ) : null}
            </Card>
          );
        })
      ) : elements ? (
        elements.map((element) => <Element key={element}>{element}</Element>)
      ) : (
        <Element>{exampleContent}</Element>
      )}
    </Box>
  ));

  if (layout === 'columns') {
    return (
      <Box layout="columns" maxColumns={4}>
        {content}
      </Box>
    );
  }

  return (
    <Box direction="row" wrap="wrap" maxColumns={4}>
      {content}
    </Box>
  );
});

StorybookBoxExamples.displayName = 'StorybookBoxExamples';

const StorybookFloatingFilterBar = memo(() => {
  const [filterBarPlacement, setFilterBarPlacement] = useState('top');
  const [filterBarHideOnScroll, setFilterBarHideOnScroll] = useState(false);

  const handlePlacementChange = useCallback((isChecked) => {
    setFilterBarPlacement(isChecked ? 'bottom' : 'top');
  }, []);

  const storybookFilterBarChoices = useMemo(() => [
    ...STORYBOOK_FILTER_BAR_CHOICES,
    {
      id: 'storybook-placement-toggle',
      label: filterBarPlacement === 'bottom' ? 'Bottom' : 'Top',
      checked: filterBarPlacement === 'bottom',
      onCheckedChange: handlePlacementChange,
    },
    {
      id: 'storybook-hide-on-scroll-toggle',
      label: 'Hide on scroll',
      checked: filterBarHideOnScroll,
      onCheckedChange: setFilterBarHideOnScroll,
    },
  ], [filterBarPlacement, filterBarHideOnScroll, handlePlacementChange]);

  return (
    <FilterBar
      choices={storybookFilterBarChoices}
      drawers={STORYBOOK_FILTER_BAR_DRAWERS}
      placement={filterBarPlacement}
      hideOnScroll={filterBarHideOnScroll}
    />
  );
});

StorybookFloatingFilterBar.displayName = 'StorybookFloatingFilterBar';

const StorybookModalSection = memo(() => {
  const [openModalDemo, setOpenModalDemo] = useState(null);

  const handleOpenDefaultModal = useCallback(() => {
    setOpenModalDemo('default');
  }, []);

  const handleOpenMinimalModal = useCallback(() => {
    setOpenModalDemo('minimal');
  }, []);

  const handleOpenWideModal = useCallback(() => {
    setOpenModalDemo('wide');
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModalDemo(null);
  }, []);

  return (
    <Box
      component="section"
      title="Modal"
      titleComponent="h2"
      titleVariant="h2"
      background="surface"
    >
      <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
        <Button onClick={handleOpenDefaultModal}>Open default modal</Button>
        <Button onClick={handleOpenMinimalModal}>Open minimal modal</Button>
        <Button onClick={handleOpenWideModal}>Open locked modal</Button>
      </Box>

      <Modal
        open={openModalDemo === 'default'}
        onClose={handleCloseModal}
        title="Festival settings"
        subtitle="Reusable modal shell with optional header and bottom controls."
        controls={(
          <>
            <Button onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleCloseModal}>
              Save changes
            </Button>
          </>
        )}
      >
        <Box gap="var(--dq-ui-space-lg)">
          <Element>Body content lives in the central slot and inherits the shared `surface-blur` shell.</Element>
          <Element>Use this shape for forms, confirmation flows and richer settings content.</Element>
        </Box>
      </Modal>

      <Modal
        open={openModalDemo === 'minimal'}
        onClose={handleCloseModal}
        ariaLabel="Minimal modal example"
      >
        <Box gap="var(--dq-ui-space-lg)">
          <Element>This one shows the shell without title or controls.</Element>
          <Element>The close icon still gives a clean dismiss path when the header copy is optional.</Element>
        </Box>
      </Modal>

      <Modal
        open={openModalDemo === 'wide'}
        onClose={handleCloseModal}
        title="Lineup comparison"
        subtitle="Outside click is disabled here, so use the close button or footer actions."
        closeOnOutsideClick={false}
        maxWidth="720px"
        controls={(
          <>
            <Button onClick={handleCloseModal}>
              Close
            </Button>
            <Button onClick={handleCloseModal}>
              Compare artists
            </Button>
          </>
        )}
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
  );
});

StorybookModalSection.displayName = 'StorybookModalSection';

const StorybookDrawerSection = memo(() => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return (
    <Box
      component="section"
      title="Drawer"
      titleComponent="h2"
      titleVariant="h2"
      background="surface"
    >
      <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
        <Button onClick={handleOpenDrawer}>Open bottom drawer</Button>
      </Box>

      <Drawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        title="Festival quick panel"
        meta1="Live"
        meta2="Friday"
        meta3="22:00 – 23:00"
        description="This panel displays a custom description in the header, separated by a divider, just like the bottom part of a card. Use the description prop to add this text."
      >
        <Box gap="var(--dq-ui-space-lg)">
          {STORYBOOK_DRAWER_SCROLL_ITEMS.map((item) => (
            <Element key={item}>{item}</Element>
          ))}
        </Box>
      </Drawer>
    </Box>
  );
});

StorybookDrawerSection.displayName = 'StorybookDrawerSection';

const StorybookSlidingColumnsSection = memo(() => (
  <Box
    component="section"
    title="Sliding Columns"
    titleComponent="h2"
    titleVariant="h2"
    background="surface"
  >
    <Box gap="var(--dq-ui-space-xl)">
      <Box
        background="surface"
        title="Stacked Default"
        titleComponent="h3"
        titleVariant="h4"
      >
        <Box gap="var(--dq-ui-space-lg)">
          <p className="dq-ui-storybook__helper-text">
            Default behavior stays in one stacked column with a floating badge sticky above each section.
          </p>
          <SlidingColumns
            sections={STORYBOOK_SLIDING_COLUMNS_SECTIONS.map((section) => ({
              ...section,
              content: renderStorybookSlidingColumnContent(section),
            }))}
          />
        </Box>
      </Box>

      <Box
        background="surface"
        title="Responsive Variant"
        titleComponent="h3"
        titleVariant="h4"
      >
        <Box gap="var(--dq-ui-space-lg)">
          <p className="dq-ui-storybook__helper-text">
            `variant=&quot;responsive&quot;` stays stacked on desktop and only switches to the horizontal synced rail on touch devices below the desktop breakpoint.
          </p>
          <SlidingColumns
            variant="responsive"
            sections={STORYBOOK_SLIDING_COLUMNS_SECTIONS.map((section) => ({
              ...section,
              content: renderStorybookSlidingColumnContent(section, 'responsive-'),
            }))}
          />
        </Box>
      </Box>
    </Box>
  </Box>
));

StorybookSlidingColumnsSection.displayName = 'StorybookSlidingColumnsSection';

const StorybookPeopleSection = memo(() => {
  return (
    <Box
      component="section"
      title="People"
      titleComponent="h2"
      titleVariant="h2"
      background="surface"
    >
      <Box
        className="dq-ui-storybook__button-sections"
        direction="row"
        wrap="wrap"
        align="stretch"
      >
        <Box
          className="dq-ui-storybook__button-section"
          background="surface"
          title="PeopleStack"
          titleComponent="h3"
          titleVariant="h4"
        >
          <Box gap="var(--dq-ui-space-lg)">
            <p className="dq-ui-storybook__helper-text">
              Default max is `10`.
            </p>
            <PeopleStack
              avatars={STORYBOOK_PEOPLE_STACK_AVATARS}
              ariaLabel="Open tribe details for 12 members"
            />
            <p className="dq-ui-storybook__helper-text">
              Custom max at `5`.
            </p>
            <PeopleStack
              avatars={STORYBOOK_PEOPLE_STACK_AVATARS}
              maxVisible={5}
              ariaLabel="Open tribe details for 12 members"
            />
            <PeopleStack
              avatars={presetAvatarOptions.slice(0, 4).map((avatar) => avatar.url)}
              maxVisible={5}
              ariaLabel="Open tribe details for 4 members"
            />
          </Box>
        </Box>

        <Box
          className="dq-ui-storybook__button-section"
          background="surface"
          title="PeopleCard"
          titleComponent="h3"
          titleVariant="h4"
        >
          <Box gap="var(--dq-ui-space-lg)">
            <PeopleCard
              avatarSrc={getPresetAvatarUrl(1)}
              name="Dylan B."
              handle="@daddydi"
              owner
            />
            <PeopleCard
              avatarSrc={getPresetAvatarUrl(2)}
              name="Usera Testa"
              handle="@test"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

StorybookPeopleSection.displayName = 'StorybookPeopleSection';

const StorybookBody = memo(() => {
  const [radioValue, setRadioValue] = useState('all');
  const [profileAvatarPreset, setProfileAvatarPreset] = useState(1);
  const profileAvatarSrc = getPresetAvatarUrl(profileAvatarPreset);

  return (
    <>
      <StorybookFloatingFilterBar />

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
            title="Select Input"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <SelectInput
                label="Festival day"
                defaultValue="friday"
                options={[
                  { value: 'thursday', label: 'Thursday' },
                  { value: 'friday', label: 'Friday' },
                  { value: 'saturday', label: 'Saturday' },
                  { value: 'sunday', label: 'Sunday' },
                ]}
              />
              <SelectInput
                label="Stage"
                defaultValue="blue"
                description="Native select control for constrained form choices."
                options={[
                  { value: 'red', label: 'RED' },
                  { value: 'blue', label: 'BLUE' },
                  { value: 'black', label: 'BLACK' },
                ]}
              />
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Date Time Input"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <DateTimeInput
                label="Show start"
                dateValue="2026-05-14"
                timeValue="16:00"
                onDateChange={() => {}}
                onTimeChange={() => {}}
              />
              <DateTimeInput
                label="Show end"
                dateValue="2026-05-15"
                timeValue="04:00"
                onDateChange={() => {}}
                onTimeChange={() => {}}
              />
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
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Badge size="sm">DEFAULT SM</Badge>
              <Badge size="sm" color="#22c55e">Live SM</Badge>
              <Badge size="sm" variant="plain">
                PLAIN SM
              </Badge>
              <Badge size="sm" variant="plain" color="#ca2323">
                Hotfix SM
              </Badge>
            </Box>
          </Box>

          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Floating"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box className="dq-ui-storybook__buttons" direction="row" wrap="wrap" gap="var(--dq-ui-space-lg)">
              <Badge variant="floating">Friday</Badge>
              <Badge variant="floating" color="#38bdf8">Saturday</Badge>
              <Badge variant="floating" color="#22c55e">Sunday</Badge>
              <Badge variant="floating" color="#a855f7">Weekend</Badge>
            </Box>
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
                imageSrc={getPresetAvatarUrl(1)}
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
        title="Profile"
        titleComponent="h2"
        titleVariant="h2"
      >
        <Profile
          firstName="Dylan"
          lastName="B."
          username="daddydi"
          avatarSrc={profileAvatarSrc}
          onChangePreset={() => {
            const nextPreset = getRandomPresetAvatarIndex(profileAvatarPreset);
            setProfileAvatarPreset(nextPreset);
            return getPresetAvatarUrl(nextPreset);
          }}
        />
      </Box>

      <StorybookPeopleSection />

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
                  <ToggleButton variant="likes" icon={HeartIcon} fillOnPress>
                    Likes
                  </ToggleButton>
                  <ToggleButton
                    variant="likes"
                    icon={HeartIcon}
                    fillOnPress
                    ariaLabel="Likes"
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
                  <ChoiceButton defaultChecked selectedIcon={CheckIcon} tag="NEW">
                    Premium
                  </ChoiceButton>
                  <ChoiceButton>Parking</ChoiceButton>
                  <ChoiceButton color="#00FF00" radius="rounded">
                    Green
                  </ChoiceButton>
                  <ChoiceButton variant="favorite" icon={UsersIcon} fillOnPress>
                    My Tribe
                  </ChoiceButton>
                  <ChoiceButton variant="likes" icon={HeartIcon} fillOnPress>
                    Likes
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
                  <ChoiceButton
                    type="radio"
                    name="storybook-filter"
                    checked={radioValue === 'all'}
                    onChange={() => setRadioValue('all')}
                  >
                    All
                  </ChoiceButton>
                  <ChoiceButton
                    type="radio"
                    name="storybook-filter"
                    checked={radioValue === 'blue'}
                    onChange={() => setRadioValue('blue')}
                    color="#0BDBEF"
                    radius="rounded"
                  >
                    Blue
                  </ChoiceButton>
                  <ChoiceButton
                    type="radio"
                    name="storybook-filter"
                    checked={radioValue === 'magenta'}
                    onChange={() => setRadioValue('magenta')}
                    color="#FF008B"
                    radius="rounded"
                  >
                    Magenta
                  </ChoiceButton>
                  <ChoiceButton
                    type="radio"
                    name="storybook-filter"
                    checked={radioValue === 'selected'}
                    onChange={() => setRadioValue('selected')}
                    selectedIcon={CheckIcon}
                    tag="NEW"
                  >
                    Selected
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
                <Element>Lineup</Element>
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
            <DropdownDrawer items={STORYBOOK_DROPDOWN_DRAWER_ITEMS} />
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
        >
          <Box
            className="dq-ui-storybook__button-section"
          >
            <Tabs ariaLabel="Storybook tabs" items={STORYBOOK_TABS_ITEMS} />
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
            A fresh data bundle is waiting with the latest Lineup corrections and tribe updates.
          </Alert>
        </Box>
      </Box>

      <StorybookModalSection />

      <StorybookDrawerSection />

      <StorybookSlidingColumnsSection />

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
        >
          <Box
            className="dq-ui-storybook__button-section"
            background="surface"
            title="Search Input"
            titleComponent="h3"
            titleVariant="h4"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <SearchInput
                ariaLabel="Search"
                placeholder="Search an artist, duo, show..."
              />
            </Box>
          </Box>

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
                description="Keep the Lineup focused on what is still ahead."
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
        title="Boxes"
        titleComponent="h2"
        titleVariant="h2"
      >
        <StorybookBoxExamples />
      </Box>

      <Box
        component="section"
        title="Boxes Columns"
        titleComponent="h2"
        titleVariant="h2"
      >
        <StorybookBoxExamples layout="columns" />
      </Box>
    </>
  );
});

StorybookBody.displayName = 'StorybookBody';

const StorybookBaseView = memo(({
  onOpenView,
  onOpenSearch,
  onOpenSettings,
  headerTransitionState,
  isHidden,
}) => (
  <View
    navbar
    onOpenView={onOpenView}
    onOpenSearch={onOpenSearch}
    onUserClick={onOpenSettings}
    headerTransitionState={headerTransitionState}
    isHidden={isHidden}
  >
    <StorybookBody />
  </View>
));

StorybookBaseView.displayName = 'StorybookBaseView';

const StorybookPageLayer = memo(({
  page,
  layerIndex,
  onOpenPage,
  onClosePage,
  isHidden,
  transitionState,
}) => {
  const pageDefinition = PAGE_DEFINITIONS[page.type];

  if (!pageDefinition) {
    return null;
  }

  const PageContent = pageDefinition.Component;
  const HeaderContent = pageDefinition.HeaderContentComponent;

  return (
    <Page
      title={pageDefinition.title}
      onClose={() => onClosePage(page.id)}
      onOpenPage={onOpenPage}
      headerContent={HeaderContent ? <HeaderContent onClosePage={() => onClosePage(page.id)} /> : null}
      showFooter={pageDefinition.showFooter !== false}
      wideHeaderContent={pageDefinition.wideHeaderContent === true}
      hideHeaderBrand={pageDefinition.hideHeaderBrand === true}
      showCloseButton={pageDefinition.showCloseButton !== false}
      inlineCloseButton={pageDefinition.inlineCloseButton === true}
      isHidden={isHidden}
      transitionState={transitionState}
      layerIndex={layerIndex}
    >
      <PageContent onOpenPage={onOpenPage} />
    </Page>
  );
});

StorybookPageLayer.displayName = 'StorybookPageLayer';

const StorybookView = ({ onOpenView = null }) => {
  const pageIdRef = useRef(0);
  const initialPageStack = useMemo(() => getHistoryPageStack({
    historyState: window.history.state,
    pageDefinitions: PAGE_DEFINITIONS,
  }), []);
  const pageStackRef = useRef(initialPageStack);
  const [pageStack, setPageStack] = useState(initialPageStack);
  const {
    renderedPageStack,
    hasRenderedPages,
    shouldHideBaseView,
    topPageTransitionState,
    getIsPageHidden,
  } = useAnimatedPageStack(pageStack);

  useDocumentScrollLock(hasRenderedPages);

  useEffect(() => {
    pageStackRef.current = pageStack;
    syncPageStackIdRef({
      pageIdRef,
      pageStack,
    });
  }, [pageStack]);

  useEffect(() => {
    replaceHistoryPageStackState({
      url: `${window.location.pathname}${window.location.search}`,
      pageStack,
    });
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const nextRoute = resolveRoute(window.location.pathname, window.location.search);

      if (nextRoute.view !== 'storybook') {
        return;
      }

      const nextPageStack = getHistoryPageStack({
        historyState: event.state,
        pageDefinitions: PAGE_DEFINITIONS,
      });

      pageStackRef.current = nextPageStack;
      setPageStack(nextPageStack);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openPage = useCallback((type) => {
    if (!PAGE_DEFINITIONS[type]) {
      return;
    }

    const nextStack = getNextPageStackOnOpen({
      currentStack: pageStackRef.current,
      nextType: type,
      pageDefinitions: PAGE_DEFINITIONS,
      createPageId: (pageType) => {
        pageIdRef.current += 1;
        return `${pageType}-${pageIdRef.current}`;
      },
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    pushHistoryPageStackState({
      url: `${window.location.pathname}${window.location.search}`,
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, []);

  const closePage = useCallback((pageId) => {
    const nextStack = getNextPageStackOnClose({
      currentStack: pageStackRef.current,
      pageId,
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    pushHistoryPageStackState({
      url: `${window.location.pathname}${window.location.search}`,
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, []);

  const openSettings = useCallback(() => {
    openPage('settings');
  }, [openPage]);

  const openSearch = useCallback(() => {
    openPage('search');
  }, [openPage]);

  const baseViewHeaderTransitionState = useMemo(() => {
    if (!hasRenderedPages) {
      return 'open';
    }

    if (topPageTransitionState === 'entering') {
      return 'exiting';
    }

    if (topPageTransitionState === 'exiting') {
      return 'entering';
    }

    return 'covered';
  }, [hasRenderedPages, topPageTransitionState]);

  return (
    <UiThemeScope>
      <StorybookBaseView
        onOpenView={onOpenView}
        onOpenSearch={openSearch}
        onOpenSettings={openSettings}
        headerTransitionState={baseViewHeaderTransitionState}
        isHidden={shouldHideBaseView}
      />

      {renderedPageStack.map((page, index) => (
        <StorybookPageLayer
          key={page.id}
          page={page}
          layerIndex={index}
          onOpenPage={openPage}
          onClosePage={closePage}
          isHidden={getIsPageHidden(index)}
          transitionState={page.transitionState}
        />
      ))}

      {!hasRenderedPages ? <BackToTop /> : null}
    </UiThemeScope>
  );
};

export default StorybookView;
