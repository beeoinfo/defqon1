import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import Box from '../../layout/Box/index';
import ToggleButton from '../ToggleButton/index';
import './Dropdown.css';

const DRAWER_ANIMATION_MS = 160;

function getAnchorName(id) {
  return `--dq-ui-dropdown-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function DropdownChevron({ size }) {
  return (
    <span className="dq-ui-dropdown__chevron">
      <ChevronDown className="dq-ui-dropdown__chevron-icon dq-ui-dropdown__chevron-icon--closed" size={size} />
      <ChevronUp className="dq-ui-dropdown__chevron-icon dq-ui-dropdown__chevron-icon--open" size={size} />
    </span>
  );
}

export function DropdownDrawer({
  items = [],
  value,
  defaultValue = null,
  onValueChange,
  allowClose = true,
  label = 'Dropdown drawer',
  size = 'md',
  radius = 'md',
  variant = 'ghost',
  color,
  className = '',
  triggerClassName = '',
  contentClassName = '',
  ...props
}) {
  const drawerId = useId();
  const drawerRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;
  const [renderedValue, setRenderedValue] = useState(activeValue);
  const [panelState, setPanelState] = useState(activeValue === null ? 'closed' : 'open');
  const renderedItem = items.find((item) => item.value === renderedValue);

  function setNextValue(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  useEffect(() => {
    if (activeValue === renderedValue) {
      if (activeValue !== null) {
        setPanelState('open');
      }

      return undefined;
    }

    if (renderedValue !== null) {
      setPanelState('closing');

      const timeout = setTimeout(() => {
        setRenderedValue(activeValue);
        setPanelState(activeValue === null ? 'closed' : 'open');
      }, DRAWER_ANIMATION_MS);

      return () => clearTimeout(timeout);
    }

    setRenderedValue(activeValue);
    setPanelState(activeValue === null ? 'closed' : 'open');
    return undefined;
  }, [activeValue, renderedValue]);

  useEffect(() => {
    if (activeValue === null) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!drawerRef.current?.contains(event.target)) {
        setNextValue(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setNextValue(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeValue, isControlled, onValueChange]);

  return (
    <section
      {...props}
      ref={drawerRef}
      className={['dq-ui-dropdown-drawer', className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <Box
        className="dq-ui-dropdown-drawer__triggers"
        slot="content"
        component="div"
        direction="row"
        wrap="wrap"
        gap="var(--dq-ui-space-lg)"
        role="group"
        aria-label={label}
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const nextValue = isActive && allowClose ? null : item.value;

          return (
            <ToggleButton
              key={item.value}
              pressed={isActive}
              onPressedChange={() => setNextValue(nextValue)}
              size={item.size ?? size}
              radius={item.radius ?? radius}
              variant={item.variant ?? variant}
              color={item.color ?? color}
              icon={DropdownChevron}
              iconPosition="end"
              aria-expanded={isActive}
              aria-controls={renderedItem ? drawerId : undefined}
              className={['dq-ui-dropdown-drawer__trigger', triggerClassName, item.className]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </ToggleButton>
          );
        })}
      </Box>

      {renderedItem ? (
        <section
          key={renderedItem.value}
          id={drawerId}
          role="region"
          aria-label={renderedItem.label}
          className={[
            'dq-ui-dropdown-drawer__content',
            panelState === 'closing' ? 'dq-ui-dropdown-drawer__panel--closing' : '',
            contentClassName,
          ].filter(Boolean).join(' ')}
        >
          <Box className="dq-ui-dropdown-drawer__panel">
            {renderedItem.content}
          </Box>
        </section>
      ) : null}
    </section>
  );
}

export default function Dropdown({
  label = 'Dropdown',
  children,
  size = 'md',
  radius = 'md',
  variant = 'ghost',
  color,
  placement = 'bottom',
  className = '',
  contentClassName = '',
  buttonClassName = '',
  buttonProps = {},
  ...props
}) {
  const generatedId = useId();
  const popoverId = `dq-ui-dropdown-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const anchorName = getAnchorName(generatedId);
  const resolvedPlacement = placement === 'top' ? 'top' : 'bottom';
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [effectivePlacement, setEffectivePlacement] = useState(resolvedPlacement);

  useEffect(() => {
    const popover = document.getElementById(popoverId);
    const trigger = triggerRef.current;

    if (!popover || !trigger) {
      return undefined;
    }

    let frame = 0;

    const syncEffectivePlacement = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextOpen = popover.matches(':popover-open');

        setIsOpen(nextOpen);

        if (!nextOpen) {
          setEffectivePlacement(resolvedPlacement);
          return;
        }

        const popoverRect = popover.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();
        const popoverCenter = popoverRect.top + popoverRect.height / 2;
        const triggerCenter = triggerRect.top + triggerRect.height / 2;

        setEffectivePlacement(popoverCenter < triggerCenter ? 'top' : 'bottom');
      });
    };

    popover.addEventListener('toggle', syncEffectivePlacement);
    window.addEventListener('resize', syncEffectivePlacement);
    window.addEventListener('scroll', syncEffectivePlacement, true);

    syncEffectivePlacement();

    return () => {
      cancelAnimationFrame(frame);
      popover.removeEventListener('toggle', syncEffectivePlacement);
      window.removeEventListener('resize', syncEffectivePlacement);
      window.removeEventListener('scroll', syncEffectivePlacement, true);
    };
  }, [popoverId, resolvedPlacement]);

  return (
    <Box
      {...props}
      className={['dq-ui-dropdown', className].filter(Boolean).join(' ')}
    >
      <ToggleButton
        {...buttonProps}
        ref={(node) => {
          triggerRef.current = node;

          if (typeof buttonProps.ref === 'function') {
            buttonProps.ref(node);
          } else if (buttonProps.ref) {
            buttonProps.ref.current = node;
          }
        }}
        style={{
          '--dq-ui-dropdown-anchor-name': anchorName,
          ...buttonProps.style,
        }}
        className={['dq-ui-dropdown__trigger', buttonClassName].filter(Boolean).join(' ')}
        data-placement={resolvedPlacement}
        data-effective-placement={effectivePlacement}
        pressed={isOpen}
        size={size}
        radius={radius}
        variant={variant}
        color={color}
        icon={DropdownChevron}
        iconPosition="end"
        aria-haspopup="dialog"
        aria-controls={popoverId}
        popovertarget={popoverId}
        popovertargetaction="toggle"
      >
        {label}
      </ToggleButton>

      <Box
        id={popoverId}
        popover="auto"
        background="surface-blur"
        style={{ '--dq-ui-dropdown-anchor-name': anchorName }}
        className={[
          'dq-ui-dropdown__content',
          `dq-ui-dropdown__content--${resolvedPlacement}`,
          contentClassName,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </Box>
    </Box>
  );
}
