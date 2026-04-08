import { useEffect, useRef, useState } from 'react';
import ToggleButton from '../../primitives/ToggleButton';
import Box from '../Box';
import './Navbar.css';

const getItemKey = (item) => item.id ?? item.label;

const getActiveItemKey = (items) => {
  const activeItem = items.find((item) => item.active);

  return activeItem ? getItemKey(activeItem) : null;
};

const Navbar = ({
  component = 'nav',
  items = [],
  className = '',
  children,
  ariaLabel = 'Main navigation',
  ...props
}) => {
  const Component = component;
  const hasItems = items.length > 0;
  const controlledActiveKey = getActiveItemKey(items);
  const [internalActiveKey, setInternalActiveKey] = useState(null);
  const [bouncingItemKey, setBouncingItemKey] = useState(null);
  const resolvedActiveKey = controlledActiveKey ?? internalActiveKey;
  const bounceFrameRef = useRef(null);
  const bounceTimeoutRef = useRef(null);

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
          {items.map((item) => {
            const Icon = item.icon;
            const itemKey = getItemKey(item);
            const isActive = itemKey === resolvedActiveKey;

            return (
              <Box
                key={itemKey}
                component="li"
                className={[
                  'dq-layout-navbar__item-shell',
                  itemKey === bouncingItemKey ? 'dq-layout-navbar__item-shell--bouncing' : '',
                  item.mobileOnly ? 'dq-layout-navbar__item-shell--mobile-only' : '',
                  item.desktopOnly ? 'dq-layout-navbar__item-shell--desktop-only' : '',
                ].filter(Boolean).join(' ')}
              >
                <ToggleButton
                  className="dq-layout-navbar__item"
                  pressed={isActive}
                  icon={Icon}
                  fillOnPress
                  radius="rounded"
                  aria-current={isActive ? 'page' : undefined}
                  ariaLabel={item.ariaLabel}
                  title={item.title}
                  onPressedChange={() => {
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
