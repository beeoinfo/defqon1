import { MagnifyingGlassIcon, MapTrifoldIcon, MusicNoteIcon, StarIcon } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ToggleButton from '../../primitives/ToggleButton';
import Box from '@/components/layout/Box';
import './Navbar.css';

const DEFAULT_NAVBAR_ITEMS = [
  {
    id: 'lineup',
    label: 'Line-up',
    icon: MusicNoteIcon,
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
];

const getItemKey = (item) => item.id ?? item.label;

const getActiveItemKey = (items) => {
  const activeItem = items.find((item) => item.active);

  return activeItem ? getItemKey(activeItem) : null;
};

const Navbar = ({
  component = 'nav',
  items = [],
  activeView = null,
  onOpenView = null,
  onOpenSearch = null,
  className = '',
  children,
  ariaLabel = 'Main navigation',
  ...props
}) => {
  const Component = component;
  const resolvedItems = useMemo(() => {
    if (items.length > 0) {
      return items;
    }

    return [
      ...DEFAULT_NAVBAR_ITEMS.map((item) => ({
        ...item,
        active: item.id === activeView,
        onClick: () => onOpenView?.(item.id),
      })),
      {
        id: 'search',
        label: 'Search',
        icon: MagnifyingGlassIcon,
        ariaLabel: 'Open search',
        title: 'Open search',
        togglesActive: false,
        showIconDesktop: true,
        onClick: () => onOpenSearch?.(),
      },
    ];
  }, [activeView, items, onOpenSearch, onOpenView]);
  const hasItems = resolvedItems.length > 0;
  const incomingActiveKey = getActiveItemKey(resolvedItems);
  const [internalActiveKey, setInternalActiveKey] = useState(() => incomingActiveKey);
  const [bouncingItemKey, setBouncingItemKey] = useState(null);
  const resolvedActiveKey = internalActiveKey;
  const bounceFrameRef = useRef(null);
  const bounceTimeoutRef = useRef(null);

  useEffect(() => {
    setInternalActiveKey((currentActiveKey) => (
      currentActiveKey === incomingActiveKey ? currentActiveKey : incomingActiveKey
    ));
  }, [incomingActiveKey]);

  useEffect(() => () => {
    if (bounceFrameRef.current) {
      window.cancelAnimationFrame(bounceFrameRef.current);
    }

    if (bounceTimeoutRef.current) {
      window.clearTimeout(bounceTimeoutRef.current);
    }
  }, []);

  const triggerBounce = (itemKey) => {
    if (bounceFrameRef.current) {
      window.cancelAnimationFrame(bounceFrameRef.current);
    }

    if (bounceTimeoutRef.current) {
      window.clearTimeout(bounceTimeoutRef.current);
    }

    setBouncingItemKey(null);
    bounceFrameRef.current = window.requestAnimationFrame(() => {
      setBouncingItemKey(itemKey);
      bounceTimeoutRef.current = window.setTimeout(() => {
        setBouncingItemKey((currentItemKey) => (currentItemKey === itemKey ? null : currentItemKey));
      }, 420);
    });
  };

  return (
    <Component
      {...props}
      className={['dq-layout-navbar', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      {hasItems ? (
        <Box
          className="dq-layout-navbar__list"
          component="ul"
          slot="content"
          direction="row"
          align="center"
          justify="center"
          gap="var(--dq-ui-space-sm)"
        >
          {resolvedItems.map((item) => {
            const Icon = item.icon;
            const itemKey = getItemKey(item);
            const togglesActive = item.togglesActive !== false;
            const isActive = togglesActive && itemKey === resolvedActiveKey;

            return (
              <Box
                key={itemKey}
                component="li"
                className={[
                  'dq-layout-navbar__item-shell',
                  itemKey === bouncingItemKey ? 'dq-layout-navbar__item-shell--bouncing' : '',
                  item.showIconDesktop ? 'dq-layout-navbar__item-shell--show-icon-desktop' : '',
                  item.mobileOnly ? 'dq-layout-navbar__item-shell--mobile-only' : '',
                  item.desktopOnly ? 'dq-layout-navbar__item-shell--desktop-only' : '',
                ].filter(Boolean).join(' ')}
              >
                <ToggleButton
                  className="dq-layout-navbar__item"
                  pressed={isActive}
                  icon={Icon}
                  badge={item.badge}
                  fillOnPress
                  radius="rounded"
                  aria-current={isActive ? 'page' : undefined}
                  ariaLabel={item.ariaLabel}
                  title={item.title}
                  onPressedChange={() => {
                    if (!togglesActive) {
                      return;
                    }

                    const shouldAnimate = itemKey !== resolvedActiveKey;

                    setInternalActiveKey(itemKey);

                    if (shouldAnimate) {
                      triggerBounce(itemKey);
                    }
                  }}
                  onClick={item.onClick}
                >
                  {item.label}
                </ToggleButton>
              </Box>
            );
          })}
        </Box>
      ) : (
        children
      )}
    </Component>
  );
};

export default Navbar;
