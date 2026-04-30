import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '../layout/Box';
import Button from '../primitives/Button';
import ChoiceButton from '../primitives/ChoiceButton';
import { DropdownChevron } from '../primitives/Dropdown';
import ToggleButton from '../primitives/ToggleButton';
import './FilterBar.css';

const FILTER_BAR_DRAWER_ANIMATION_MS = 160;
const FILTER_BAR_RESET_ANIMATION_MS = 160;
const FILTER_BAR_SCROLL_HIDE_DELAY_MS = 140;
const FILTER_BAR_SCROLL_THRESHOLD = 240;

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

const hasFilterValue = (value) => (
  Object.values(value).some((entry) => (Array.isArray(entry) ? entry.length > 0 : Boolean(entry)))
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
  const isScrollHiddenRef = useRef(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasSelection = hasFilterValue(currentValue);
  const renderedDrawer = drawers.find((drawer) => drawer.id === renderedDrawerId);
  const resolvedPlacement = placement === 'bottom' ? 'bottom' : 'top';
  const resetButtonOptions = typeof resetButton === 'object' ? resetButton : {};
  const showsResetButton = resetButton !== false && hasSelection;
  const shouldRenderResetButton = resetButtonState !== 'closed';
  const shouldControlTopStickyOffset = floating && resolvedPlacement === 'top';

  const syncContentOffset = useCallback((isHidden = isScrollHiddenRef.current) => {
    const filterBarElement = filterBarRef.current;
    const layoutRoot = getLayoutRoot(filterBarElement);
    const shouldControlStickyOffset =
      Boolean(filterBarElement) && shouldControlTopStickyOffset;

    if (!layoutRoot) {
      return;
    }

    layoutRoot.classList.toggle(TOP_FILTER_BAR_LAYOUT_CLASS, shouldControlStickyOffset);

    if (!shouldControlStickyOffset || isHidden) {
      layoutRoot.style.removeProperty('--dq-layout-filter-bar-content-offset');
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

    layoutRoot.style.setProperty('--dq-layout-filter-bar-content-offset', `${filterBarBottom + stickyGap}px`);
  }, [shouldControlTopStickyOffset]);

  const syncScrollHiddenState = (nextHidden) => {
    const filterBarElement = filterBarRef.current;

    if (!filterBarElement || isScrollHiddenRef.current === nextHidden) {
      return;
    }

    isScrollHiddenRef.current = nextHidden;
    filterBarElement.classList.toggle('dq-filter-bar--scroll-hidden', nextHidden);

    if (shouldControlTopStickyOffset) {
      syncContentOffset(nextHidden);
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
    const nextValue = getInitialValue({ choices, drawers });

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

  useEffect(() => {
    openDrawerRef.current = openDrawer;
  }, [openDrawer]);

  useEffect(() => {
    if (showsResetButton) {
      if (resetButtonState === 'open' || resetButtonState === 'opening') {
        return undefined;
      }

      setResetButtonState('opening');

      const timeout = setTimeout(() => {
        setResetButtonState('open');
      }, FILTER_BAR_RESET_ANIMATION_MS);

      return () => clearTimeout(timeout);
    }

    if (resetButtonState === 'closed' || resetButtonState === 'closing') {
      return undefined;
    }

    setResetButtonState('closing');

    const timeout = setTimeout(() => {
      setResetButtonState('closed');
    }, FILTER_BAR_RESET_ANIMATION_MS);

    return () => clearTimeout(timeout);
  }, [resetButtonState, showsResetButton]);

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
            {choices.map((choice) => {
              const choiceChecked = isChoiceChecked(choice, currentValue);

              return (
                <ChoiceButton
                  key={choice.id}
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
                >
                  {choice.label}
                </ChoiceButton>
              );
            })}

            {drawers.map((drawer) => {
              const drawerSelection = getDrawerSelection(drawer, currentValue[drawer.id]);
              const isOpen = openDrawer === drawer.id;

              return (
                <ToggleButton
                  key={drawer.id}
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
              );
            })}
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
