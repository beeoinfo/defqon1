import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import Box from '../../layout/Box';
import ToggleButton from '../ToggleButton';
import './Dropdown.css';

const DRAWER_ANIMATION_MS = 160;

const getAnchorName = (id) => `--dq-ui-dropdown-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

export const DropdownChevron = ({ size }) => {
  const adjustedSize = Math.max(size - 4, 12);

  return (
    <span className="dq-ui-dropdown__chevron">
      <CaretDownIcon className="dq-ui-dropdown__chevron-icon dq-ui-dropdown__chevron-icon--closed" size={adjustedSize} weight="bold" />
      <CaretUpIcon className="dq-ui-dropdown__chevron-icon dq-ui-dropdown__chevron-icon--open" size={adjustedSize} weight="bold" />
    </span>
  );
};

export const DropdownDrawer = ({
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
}) => {
  const drawerId = useId();
  const drawerRef = useRef(null);
  const [internalValue, setInternalValue] = useState(() => defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;
  const [renderedValue, setRenderedValue] = useState(activeValue);
  const [panelState, setPanelState] = useState(activeValue === null ? 'closed' : 'open');
  const renderedItem = items.find((item) => item.value === renderedValue);

  const setNextValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

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

    const handlePointerDown = (event) => {
      if (!drawerRef.current?.contains(event.target)) {
        setNextValue(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNextValue(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeValue]);

  return (
    <Box
      {...props}
      ref={drawerRef}
      component="section"
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
          const isSelected = isActive || Boolean(item.selected);
          const nextValue = isActive && allowClose ? null : item.value;

          return (
            <ToggleButton
              key={item.value}
              pressed={isSelected}
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
        <Box
          key={renderedItem.value}
          component="section"
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
        </Box>
      ) : null}
    </Box>
  );
};

const Dropdown = ({
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
}) => {
  const generatedId = useId();
  const popoverId = `dq-ui-dropdown-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const anchorName = getAnchorName(generatedId);
  const resolvedPlacement = placement === 'top' ? 'top' : 'bottom';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box
      {...props}
      className={['dq-ui-dropdown', className].filter(Boolean).join(' ')}
    >
      <ToggleButton
        {...buttonProps}
        style={{
          '--dq-ui-dropdown-anchor-name': anchorName,
          ...buttonProps.style,
        }}
        className={['dq-ui-dropdown__trigger', buttonClassName].filter(Boolean).join(' ')}
        data-placement={resolvedPlacement}
        data-effective-placement={resolvedPlacement}
        pressed={isOpen}
        size={size}
        radius={radius}
        variant={variant}
        color={color}
        icon={DropdownChevron}
        iconPosition="end"
        aria-haspopup="dialog"
        aria-controls={popoverId}
        popoverTarget={popoverId}
        popoverTargetAction="toggle"
      >
        {label}
      </ToggleButton>

      <Box
        id={popoverId}
        popover="auto"
        onToggle={(event) => {
          const nextOpen = event.currentTarget.matches(':popover-open');

          setIsOpen((currentOpen) => (currentOpen === nextOpen ? currentOpen : nextOpen));
        }}
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
};

export default Dropdown;
