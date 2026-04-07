import './Navbar.css';
import { useEffect, useState } from 'react';
import Box from '../Box/index';
import ToggleButton from '../../primitives/ToggleButton/index';

function getItemKey(item) {
  return item.id ?? item.label;
}

function getActiveItemKey(items) {
  const activeItem = items.find((item) => item.active);

  return activeItem ? getItemKey(activeItem) : null;
}

export default function Navbar({
  component = 'nav',
  items = [],
  className = '',
  children,
  ariaLabel = 'Main navigation',
  ...props
}) {
  const Component = component;
  const hasItems = items.length > 0;
  const controlledActiveKey = getActiveItemKey(items);
  const [activeKey, setActiveKey] = useState(controlledActiveKey);
  const resolvedActiveKey = activeKey ?? controlledActiveKey;

  useEffect(() => {
    if (controlledActiveKey) {
      setActiveKey(controlledActiveKey);
    }
  }, [controlledActiveKey]);

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
                  onPressedChange={() => setActiveKey(itemKey)}
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
}
