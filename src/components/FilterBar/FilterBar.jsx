import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '../layout/Box';
import Button from '../primitives/Button';
import ChoiceButton from '../primitives/ChoiceButton';
import { DropdownChevron } from '../primitives/Dropdown';
import ToggleButton from '../primitives/ToggleButton';
import './FilterBar.css';

const FILTER_BAR_DRAWER_ANIMATION_MS = 160;
const FILTER_BAR_BUTTON_ANIMATION_MS = 160;
const FILTER_BAR_SCROLL_HIDE_DELAY_MS = 140;
const FILTER_BAR_SCROLL_THRESHOLD = 240;
const FILTER_BAR_ITEM_STATE_OPEN = 'open';
const FILTER_BAR_ITEM_STATE_ENTERING = 'entering';
const FILTER_BAR_ITEM_STATE_EXITING = 'exiting';

const getFilterBarItemKey = (item) => item.id;

const createRenderedFilterBarItems = (items) => (
  items.map((item) => ({
    key: getFilterBarItemKey(item),
    item,
    state: FILTER_BAR_ITEM_STATE_OPEN,
  }))
);

const reconcileRenderedFilterBarItems = (renderedItems, nextItems) => {
  const nextItemsByKey = new Map(nextItems.map((item) => [getFilterBarItemKey(item), item]));
  const renderedItemsByKey = new Map(renderedItems.map((renderedItem) => [renderedItem.key, renderedItem]));
  let didChange = renderedItems.length !== nextItems.length;

  const nextRenderedItems = renderedItems.map((renderedItem) => {
    const nextItem = nextItemsByKey.get(renderedItem.key);

    if (!nextItem) {
      if (renderedItem.state === FILTER_BAR_ITEM_STATE_EXITING) {
        return renderedItem;
      }

      didChange = true;
      return {
        ...renderedItem,
        state: FILTER_BAR_ITEM_STATE_EXITING,
      };
    }

    const nextState = renderedItem.state === FILTER_BAR_ITEM_STATE_EXITING
      ? FILTER_BAR_ITEM_STATE_ENTERING
      : renderedItem.state;

    if (renderedItem.item === nextItem && renderedItem.state === nextState) {
      return renderedItem;
    }

    didChange = true;
    return {
      ...renderedItem,
      item: nextItem,
      state: nextState,
    };
  });

  nextItems.forEach((item) => {
    const key = getFilterBarItemKey(item);

    if (renderedItemsByKey.has(key)) {
      return;
    }

    didChange = true;
    nextRenderedItems.push({
      key,
      item,
      state: FILTER_BAR_ITEM_STATE_ENTERING,
    });
  });

  return didChange ? nextRenderedItems : renderedItems;
};

const settleRenderedFilterBarItems = (renderedItems) => {
  let didChange = false;

  const nextRenderedItems = renderedItems
    .filter((renderedItem) => {
      const shouldKeep = renderedItem.state !== FILTER_BAR_ITEM_STATE_EXITING;

      if (!shouldKeep) {
        didChange = true;
      }

      return shouldKeep;
    })
    .map((renderedItem) => {
      if (renderedItem.state !== FILTER_BAR_ITEM_STATE_ENTERING) {
        return renderedItem;
      }

      didChange = true;
      return {
        ...renderedItem,
        state: FILTER_BAR_ITEM_STATE_OPEN,
      };
    });

  return didChange ? nextRenderedItems : renderedItems;
};

const getInitialValue = ({ choices = [], drawers = [] }) => {
  const initialValue = {};

  choices.forEach((choice) => {
    if (choice.type === 'radio') {
      const groupName = choice.name ?? choice.id;

      if (!(groupName in initialValue)) {
        initialValue[groupName] = null;
      }

      if (choice.defaultChecked) {
        initialValue[groupName] = choice.value ?? choice.id;
      }

      return;
    }

    initialValue[choice.id] = Boolean(choice.defaultChecked);
  });

  drawers.forEach((drawer) => {
    if (drawer.type === 'checkbox') {
      initialValue[drawer.id] = drawer.options
        ?.filter((option) => option.defaultChecked)
        .map((option) => option.value) ?? [];
      return;
    }

    const defaultOption = drawer.options?.find((option) => option.defaultChecked);

    initialValue[drawer.id] = defaultOption?.reset ? null : defaultOption?.value ?? null;
  });

  return initialValue;
};

const normalizeFilterValue = (value) => {
  if (Array.isArray(value)) {
    const normalizedValues = value.filter(Boolean).sort();
    return normalizedValues.length > 0 ? normalizedValues.join('__') : null;
  }

  if (value === false) {
    return null;
  }

  return value ?? null;
};

const hasFilterValue = (value, defaultValue) => (
  Object.entries(value).some(([key, entry]) => (
    normalizeFilterValue(entry) !== normalizeFilterValue(defaultValue?.[key])
  ))
);

const isChoiceChecked = (choice, currentValue) => {
  if (choice.checked !== undefined) {
    return choice.checked;
  }

  return choice.type === 'radio'
    ? currentValue[choice.name ?? choice.id] === (choice.value ?? choice.id)
    : Boolean(currentValue[choice.id]);
};

const getDrawerSelection = (drawer, drawerValue) => {
  if (drawer.type === 'checkbox') {
    const values = Array.isArray(drawerValue) ? drawerValue : [];
    const selectedOptions = drawer.options?.filter((option) => values.includes(option.value)) ?? [];

    return {
      hasSelection: selectedOptions.length > 0,
      label: selectedOptions.length > 0 ? `${drawer.label} (${selectedOptions.length})` : drawer.label,
      color: drawer.color,
    };
  }

  const selectedOption = drawer.options?.find((option) => !option.reset && option.value === drawerValue);

  return {
    hasSelection: Boolean(selectedOption),
    label: selectedOption?.label ?? drawer.label,
    color: selectedOption?.color ?? drawer.color,
  };
};

const getLayoutRoot = (element) => (
  element?.closest?.('.dq-layout-main, .dq-layout-view, .dq-layout-page') ?? null
);

const getPixelCustomProperty = (element, propertyName, fallbackValue = 0) => {
  if (!element) {
    return fallbackValue;
  }

  const parsedValue = Number.parseFloat(getComputedStyle(element).getPropertyValue(propertyName));

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

const TOP_FILTER_BAR_LAYOUT_CLASS = 'dq-layout--has-top-filter-bar';

const FilterBar = ({
  choices = [],
  drawers = [],
  value,
  defaultValue,
  onChange,
  onReset,
  resetButton = true,
  floating = true,
  placement = 'top',
  hideOnScroll = false,
  width = 'full',
  className = '',
  ariaLabel = 'Filters',
}) => {
  const filterBarRef = useRef(null);
  const scrollRef = useRef(null);
  const openDrawerRef = useRef(null);
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? getInitialValue({ choices, drawers })
  );
  const [openDrawer, setOpenDrawer] = useState(null);
  const [renderedDrawerId, setRenderedDrawerId] = useState(null);
  const [drawerState, setDrawerState] = useState('closed');
  const [resetButtonState, setResetButtonState] = useState('closed');
  const [renderedChoices, setRenderedChoices] = useState(() => createRenderedFilterBarItems(choices));
  const [renderedDrawers, setRenderedDrawers] = useState(() => createRenderedFilterBarItems(drawers));
  const isScrollHiddenRef = useRef(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const initialValue = defaultValue ?? getInitialValue({ choices, drawers });
  const hasSelection = hasFilterValue(currentValue, initialValue);
  const renderedDrawer = drawers.find((drawer) => drawer.id === renderedDrawerId);
  const leadingRenderedDrawers = renderedDrawers.filter(
    (renderedDrawerItem) => renderedDrawerItem.item.placement !== 'end'
  );
  const trailingRenderedDrawers = renderedDrawers.filter(
    (renderedDrawerItem) => renderedDrawerItem.item.placement === 'end'
  );
  const resolvedPlacement = placement === 'bottom' ? 'bottom' : 'top';
  const resetButtonOptions = typeof resetButton === 'object' ? resetButton : {};
  const showsResetButton = resetButton !== false && hasSelection;
  const shouldRenderResetButton = resetButtonState !== 'closed';
  const shouldControlTopStickyOffset = floating && resolvedPlacement === 'top';

  const syncContentOffset = useCallback(() => {
    const filterBarElement = filterBarRef.current;
    const layoutRoot = getLayoutRoot(filterBarElement);
    const shouldControlStickyOffset =
      Boolean(filterBarElement) && shouldControlTopStickyOffset;

    if (!layoutRoot) {
      return;
    }

    layoutRoot.classList.toggle(TOP_FILTER_BAR_LAYOUT_CLASS, shouldControlStickyOffset);

    if (!shouldControlStickyOffset) {
      layoutRoot.style.removeProperty('--dq-layout-filter-bar-content-offset');
      layoutRoot.style.removeProperty('--dq-layout-filter-bar-sticky-offset');
      return;
    }

    const filterBarRow = filterBarElement.querySelector('.dq-filter-bar__row');
    const measuredElement = filterBarRow ?? filterBarElement;
    const filterBarPaddingBottom = filterBarRow
      ? getPixelCustomProperty(filterBarElement, 'padding-bottom', 0)
      : 0;
    const headerBottom = getPixelCustomProperty(
      layoutRoot,
      '--dq-layout-header-offset',
      getPixelCustomProperty(layoutRoot, '--dq-layout-header-fallback-offset', 0)
    );
    const filterBarBottom =
      filterBarElement.offsetTop +
      measuredElement.offsetTop +
      measuredElement.offsetHeight +
      filterBarPaddingBottom;
    const stickyGap = Math.max(filterBarElement.offsetTop - headerBottom, 0);

    const nextOffset = `${filterBarBottom + stickyGap}px`;

    layoutRoot.style.setProperty('--dq-layout-filter-bar-content-offset', nextOffset);

    if (isScrollHiddenRef.current) {
      layoutRoot.style.removeProperty('--dq-layout-filter-bar-sticky-offset');
      return;
    }

    layoutRoot.style.setProperty('--dq-layout-filter-bar-sticky-offset', nextOffset);
  }, [shouldControlTopStickyOffset]);

  const syncScrollHiddenState = (nextHidden) => {
    const filterBarElement = filterBarRef.current;

    if (!filterBarElement || isScrollHiddenRef.current === nextHidden) {
      return;
    }

    isScrollHiddenRef.current = nextHidden;
    filterBarElement.classList.toggle('dq-filter-bar--scroll-hidden', nextHidden);

    if (shouldControlTopStickyOffset) {
      syncContentOffset();
    }
  };

  const scrollFilterButtonIntoView = useCallback((buttonElement) => {
    const scrollElement = scrollRef.current;

    if (!scrollElement || !buttonElement) {
      return;
    }

    const scrollRect = scrollElement.getBoundingClientRect();
    const buttonRect = buttonElement.getBoundingClientRect();
    const scrollPadding = 12;

    if (buttonRect.left < scrollRect.left + scrollPadding) {
      scrollElement.scrollBy({
        left: buttonRect.left - scrollRect.left - scrollPadding,
        behavior: 'smooth',
      });
      return;
    }

    if (buttonRect.right > scrollRect.right - scrollPadding) {
      scrollElement.scrollBy({
        left: buttonRect.right - scrollRect.right + scrollPadding,
        behavior: 'smooth',
      });
    }
  }, []);

  const updateValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  const resetFilters = () => {
    const nextValue = initialValue;

    updateValue(nextValue);
    setOpenDrawer(null);
    onReset?.(nextValue);
  };

  const updateChoice = (choice, checked) => {
    choice.onCheckedChange?.(checked);

    if (choice.checked !== undefined) {
      return;
    }

    const nextValue = { ...currentValue };

    if (choice.type === 'radio') {
      if (checked) {
        nextValue[choice.name ?? choice.id] = choice.value ?? choice.id;
      }
    } else {
      nextValue[choice.id] = checked;
    }

    updateValue(nextValue);
  };

  const updateDrawerOption = (drawer, option, checked) => {
    const nextValue = { ...currentValue };

    if (drawer.type === 'checkbox') {
      const currentValues = Array.isArray(nextValue[drawer.id]) ? nextValue[drawer.id] : [];
      nextValue[drawer.id] = checked
        ? [...new Set([...currentValues, option.value])]
        : currentValues.filter((valueItem) => valueItem !== option.value);
    } else if (checked) {
      nextValue[drawer.id] = option.reset ? null : option.value;
      setOpenDrawer(null);
    }

    updateValue(nextValue);
  };

  const renderDrawerTrigger = (renderedDrawerItem) => {
    const drawer = renderedDrawerItem.item;
    const drawerSelection = getDrawerSelection(drawer, currentValue[drawer.id]);
    const isOpen = openDrawer === drawer.id;

    return (
      <Box
        key={renderedDrawerItem.key}
        component="span"
        className={[
          'dq-filter-bar__button-slot',
          `dq-filter-bar__button-slot--${renderedDrawerItem.state}`,
        ].filter(Boolean).join(' ')}
        direction="row"
        align="center"
        gap="0"
      >
        <ToggleButton
          pressed={isOpen || drawerSelection.hasSelection}
          radius="rounded"
          color={drawerSelection.color}
          icon={DropdownChevron}
          iconPosition="end"
          aria-expanded={isOpen}
          aria-controls={renderedDrawer ? `dq-filter-bar-drawer-${renderedDrawer.id}` : undefined}
          data-open={isOpen ? 'true' : 'false'}
          className="dq-filter-bar__drawer-trigger"
          onPressedChange={(nextPressed, event) => {
            scrollFilterButtonIntoView(event.currentTarget);
            setOpenDrawer(isOpen ? null : drawer.id);
          }}
        >
          {drawerSelection.label}
        </ToggleButton>
      </Box>
    );
  };

  useEffect(() => {
    openDrawerRef.current = openDrawer;
  }, [openDrawer]);

  useEffect(() => {
    setRenderedChoices((previousItems) => reconcileRenderedFilterBarItems(previousItems, choices));
  }, [choices]);

  useEffect(() => {
    setRenderedDrawers((previousItems) => reconcileRenderedFilterBarItems(previousItems, drawers));
  }, [drawers]);

  useEffect(() => {
    const hasAnimatingItems =
      renderedChoices.some((renderedItem) => renderedItem.state !== FILTER_BAR_ITEM_STATE_OPEN) ||
      renderedDrawers.some((renderedItem) => renderedItem.state !== FILTER_BAR_ITEM_STATE_OPEN);

    if (!hasAnimatingItems) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setRenderedChoices(settleRenderedFilterBarItems);
      setRenderedDrawers(settleRenderedFilterBarItems);
    }, FILTER_BAR_BUTTON_ANIMATION_MS);

    return () => clearTimeout(timeout);
  }, [renderedChoices, renderedDrawers]);

  useEffect(() => {
    setResetButtonState((currentState) => {
      if (showsResetButton) {
        return currentState === 'open' || currentState === 'opening' ? currentState : 'opening';
      }

      return currentState === 'closed' || currentState === 'closing' ? currentState : 'closing';
    });
  }, [showsResetButton]);

  const handleResetAnimationEnd = useCallback((event) => {
    if (event.currentTarget !== event.target) {
      return;
    }

    setResetButtonState((currentState) => {
      if (currentState === 'opening') {
        return 'open';
      }

      if (currentState === 'closing') {
        return 'closed';
      }

      return currentState;
    });
  }, []);

  useEffect(() => {
    if (openDrawer === renderedDrawerId) {
      if (openDrawer !== null) {
        setDrawerState('open');
      }

      return undefined;
    }

    if (renderedDrawerId !== null) {
      setDrawerState('closing');

      const timeout = setTimeout(() => {
        setRenderedDrawerId(openDrawer);
        setDrawerState(openDrawer === null ? 'closed' : 'open');
      }, FILTER_BAR_DRAWER_ANIMATION_MS);

      return () => clearTimeout(timeout);
    }

    setRenderedDrawerId(openDrawer);
    setDrawerState(openDrawer === null ? 'closed' : 'open');
    return undefined;
  }, [openDrawer, renderedDrawerId]);

  useEffect(() => {
    if (openDrawer === null) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const drawerContent = filterBarRef.current?.querySelector('.dq-filter-bar__drawer');
      const clickedDrawerTrigger = event.target.closest?.('.dq-filter-bar__drawer-trigger');

      if (!filterBarRef.current?.contains(event.target)) {
        setOpenDrawer(null);
        return;
      }

      if (clickedDrawerTrigger) {
        return;
      }

      if (drawerContent && !drawerContent.contains(event.target)) {
        setOpenDrawer(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenDrawer(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDrawer]);

  useLayoutEffect(() => {
    const handleResize = () => {
      syncContentOffset();
    };

    syncContentOffset();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      const layoutRoot = getLayoutRoot(filterBarRef.current);

      window.removeEventListener('resize', handleResize);
      layoutRoot?.style.removeProperty('--dq-layout-filter-bar-content-offset');
      layoutRoot?.style.removeProperty('--dq-layout-filter-bar-sticky-offset');
      layoutRoot?.classList.remove(TOP_FILTER_BAR_LAYOUT_CLASS);
    };
  }, [syncContentOffset]);

  useEffect(() => {
    if (!floating || !hideOnScroll) {
      syncScrollHiddenState(false);
      return undefined;
    }

    let hideTimeout = 0;
    let frame = 0;
    let previousScrollY = window.scrollY;
    let pendingScrollY = previousScrollY;
    let accumulatedScroll = 0;

    const syncScrollDirection = () => {
      frame = 0;

      const nextScrollY = pendingScrollY;
      const scrollDelta = nextScrollY - previousScrollY;

      if (Math.abs(scrollDelta) < 6) {
        return;
      }

      accumulatedScroll =
        Math.sign(scrollDelta) === Math.sign(accumulatedScroll)
          ? accumulatedScroll + scrollDelta
          : scrollDelta;

      if (Math.abs(accumulatedScroll) < FILTER_BAR_SCROLL_THRESHOLD) {
        previousScrollY = nextScrollY;
        return;
      }

      const nextHidden = accumulatedScroll > 0 && nextScrollY > 0;

      window.clearTimeout(hideTimeout);

      if (nextHidden) {
        hideTimeout = window.setTimeout(() => {
          syncScrollHiddenState(true);
          if (openDrawerRef.current !== null) {
            setOpenDrawer(null);
          }
        }, FILTER_BAR_SCROLL_HIDE_DELAY_MS);
      } else {
        syncScrollHiddenState(false);
      }

      accumulatedScroll = 0;
      previousScrollY = nextScrollY;
    };

    const handleScroll = () => {
      pendingScrollY = window.scrollY;

      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(syncScrollDirection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.clearTimeout(hideTimeout);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      syncScrollHiddenState(false);
    };
  }, [floating, hideOnScroll]);

  return (
    <Box
      ref={filterBarRef}
      background="surface-blur"
      className={[
        'dq-filter-bar',
        floating ? 'dq-filter-bar--floating' : '',
        floating ? `dq-filter-bar--floating-${resolvedPlacement}` : '',
        width === 'content' ? 'dq-filter-bar--width-content' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <Box
        className="dq-filter-bar__row"
        direction="row"
        align="center"
        gap="0"
      >
        {shouldRenderResetButton ? (
          <Box
            className={[
              'dq-filter-bar__sticky',
              resetButtonState === 'opening' ? 'dq-filter-bar__sticky--opening' : '',
              resetButtonState === 'open' ? 'dq-filter-bar__sticky--open' : '',
              resetButtonState === 'closing' ? 'dq-filter-bar__sticky--closing' : '',
            ].filter(Boolean).join(' ')}
            align="center"
            justify="center"
            onAnimationEnd={handleResetAnimationEnd}
          >
            <Button
              ariaLabel={resetButtonOptions.ariaLabel ?? 'Reset filters'}
              title={resetButtonOptions.title ?? 'Reset filters'}
              radius="rounded"
              icon={resetButtonOptions.icon ?? ArrowCounterClockwiseIcon}
              onClick={resetFilters}
            />
          </Box>
        ) : null}

        <Box className="dq-filter-bar__scroll-shell">
          <Box
            ref={scrollRef}
            className={[
              'dq-filter-bar__scroll',
              shouldRenderResetButton ? 'dq-filter-bar__scroll--with-reset' : '',
            ].filter(Boolean).join(' ')}
            slot="content"
            direction="row"
            wrap="nowrap"
            align="center"
            gap="var(--dq-ui-space-sm)"
          >
            {leadingRenderedDrawers.map(renderDrawerTrigger)}

            {renderedChoices.map((renderedChoice) => {
              const choice = renderedChoice.item;
              const choiceChecked = isChoiceChecked(choice, currentValue);

              return (
                <Box
                  key={renderedChoice.key}
                  component="span"
                  className={[
                    'dq-filter-bar__button-slot',
                    `dq-filter-bar__button-slot--${renderedChoice.state}`,
                  ].filter(Boolean).join(' ')}
                  direction="row"
                  align="center"
                  gap="0"
                >
                  <ChoiceButton
                    type={choice.type ?? 'checkbox'}
                    name={choice.name}
                    value={choice.value ?? choice.id}
                    checked={choiceChecked}
                    onCheckedChange={(checked, event) => {
                      scrollFilterButtonIntoView(event.target.closest('.dq-ui-choice-button'));
                      updateChoice(choice, checked);
                    }}
                    radius="rounded"
                    color={choice.color}
                    icon={choice.icon}
                    fillOnPress={choice.fillOnPress}
                    variant={choice.variant ?? 'ghost'}
                    tag={choice.tag}
                    tagVariant={choice.tagVariant}
                    className={choice.className}
                    labelTranslate={choice.labelTranslate}
                  >
                    {choice.label}
                  </ChoiceButton>
                </Box>
              );
            })}

            {trailingRenderedDrawers.map(renderDrawerTrigger)}
          </Box>
        </Box>
      </Box>

      {renderedDrawer ? (
        <Box
          id={`dq-filter-bar-drawer-${renderedDrawer.id}`}
          component="section"
          className={[
            'dq-filter-bar__drawer',
            drawerState === 'closing' ? 'dq-filter-bar__drawer--closing' : '',
          ].filter(Boolean).join(' ')}
          aria-label={renderedDrawer.label}
        >
          <Box
            className="dq-filter-bar__drawer-options"
            direction="row"
            wrap="wrap"
            gap="var(--dq-ui-space-sm)"
          >
            {renderedDrawer.options?.map((option) => {
              const optionChecked = renderedDrawer.type === 'checkbox'
                ? Array.isArray(currentValue[renderedDrawer.id]) && currentValue[renderedDrawer.id].includes(option.value)
                : option.reset
                  ? currentValue[renderedDrawer.id] === null || currentValue[renderedDrawer.id] === undefined
                  : currentValue[renderedDrawer.id] === option.value;

              return (
                <ChoiceButton
                  key={option.value}
                  type={renderedDrawer.type ?? 'radio'}
                  name={renderedDrawer.id}
                  value={option.value}
                  checked={optionChecked}
                  onCheckedChange={(checked) => updateDrawerOption(renderedDrawer, option, checked)}
                  radius="rounded"
                  color={option.color}
                  icon={option.icon}
                  fillOnPress={option.fillOnPress}
                  variant={option.variant ?? 'ghost'}
                  labelTranslate={option.labelTranslate}
                >
                  {option.label}
                </ChoiceButton>
              );
            })}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default memo(FilterBar);
