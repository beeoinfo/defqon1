import { useId, useRef, useState } from 'react';
import Box from '../../layout/Box/index';
import Button from '../Button/index';
import './Tabs.css';

function getEnabledIndex(items, startIndex, step) {
  const total = items.length;

  for (let offset = 0; offset < total; offset += 1) {
    const index = (startIndex + (offset * step) + total) % total;

    if (!items[index]?.disabled) {
      return index;
    }
  }

  return startIndex;
}

export default function Tabs({
  items = [],
  value,
  defaultValue,
  onValueChange,
  ariaLabel = 'Tabs',
  size = 'md',
  radius = 'md',
  className = '',
}) {
  const baseId = useId();
  const firstEnabledItem = items.find((item) => !item.disabled);
  const fallbackValue = firstEnabledItem?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? fallbackValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const currentIndex = items.findIndex((item) => item.value === currentValue);
  const selectedIndex = currentIndex >= 0 ? currentIndex : items.findIndex((item) => item.value === fallbackValue);
  const buttonRefs = useRef([]);

  function selectTab(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleKeyDown(index, event) {
    let nextIndex = index;

    if (event.key === 'ArrowRight') {
      nextIndex = getEnabledIndex(items, index + 1, 1);
    } else if (event.key === 'ArrowLeft') {
      nextIndex = getEnabledIndex(items, index - 1, -1);
    } else if (event.key === 'Home') {
      nextIndex = getEnabledIndex(items, 0, 1);
    } else if (event.key === 'End') {
      nextIndex = getEnabledIndex(items, items.length - 1, -1);
    } else {
      return;
    }

    event.preventDefault();

    const nextItem = items[nextIndex];

    if (!nextItem) {
      return;
    }

    selectTab(nextItem.value);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <Box className={['dq-ui-tabs', className].filter(Boolean).join(' ')} gap="var(--dq-ui-space-lg)">
      <Box
        className="dq-ui-tabs__list"
        component="div"
        direction="row"
        wrap="wrap"
        gap="var(--dq-ui-space-lg)"
        role="tablist"
        aria-label={ariaLabel}
      >
        {items.map((item, index) => {
          const tabId = `${baseId}-tab-${index}`;
          const panelId = `${baseId}-panel-${index}`;
          const isSelected = index === selectedIndex;

          return (
            <Button
              key={item.value}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              variant="ghost"
              size={size}
              radius={radius}
              icon={item.icon}
              disabled={item.disabled}
              selected={isSelected}
              onClick={() => selectTab(item.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>

      {items.map((item, index) => {
        const tabId = `${baseId}-tab-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        const isSelected = index === selectedIndex;

        return (
          <Box
            key={panelId}
            className="dq-ui-tabs__panel"
            component="div"
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId}
            hidden={!isSelected}
          >
            {item.content}
          </Box>
        );
      })}
    </Box>
  );
}
