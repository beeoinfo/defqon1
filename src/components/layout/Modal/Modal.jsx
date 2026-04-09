import { XIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef } from 'react';
import Box from '../Box';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import './Modal.css';

const Modal = ({
  open = false,
  onClose,
  title,
  subtitle,
  titleComponent = 'h2',
  titleVariant = 'h3',
  ariaLabel = 'Dialog',
  closeLabel = 'Close dialog',
  closeOnOutsideClick = true,
  showCloseButton = true,
  controls,
  maxWidth = '560px',
  className = '',
  bodyClassName = '',
  controlsClassName = '',
  children,
  style,
  ...props
}) => {
  const generatedId = useId();
  const sanitizedId = generatedId.replace(/[^a-zA-Z0-9_-]/g, '');
  const modalId = `dq-layout-modal-${sanitizedId}`;
  const titleId = title ? `${modalId}-title` : undefined;
  const subtitleId = subtitle ? `${modalId}-subtitle` : undefined;
  const modalRef = useRef(null);
  const hasHeader = Boolean(title) || Boolean(subtitle) || showCloseButton;
  const hasControls = controls !== null && controls !== undefined && controls !== false;
  const hasHeading = Boolean(title) || Boolean(subtitle);
  const popoverMode = closeOnOutsideClick ? 'auto' : 'manual';

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const modalElement = modalRef.current;

    if (!modalElement) {
      return undefined;
    }

    const isPopoverOpen = modalElement.matches(':popover-open');

    if (!isPopoverOpen) {
      modalElement.showPopover();
    }

    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || closeOnOutsideClick) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnOutsideClick, onClose, open]);

  const handleToggle = (event) => {
    const isPopoverOpen = event.currentTarget.matches(':popover-open');

    if (!isPopoverOpen) {
      onClose?.();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Box
      {...props}
      ref={modalRef}
      id={modalId}
      component="section"
      popover={popoverMode}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      aria-label={title ? undefined : ariaLabel}
      background="surface-blur"
      gap="var(--dq-ui-space-lg)"
      onToggle={handleToggle}
      style={{
        '--dq-layout-modal-width': maxWidth,
        ...style,
      }}
      className={['dq-layout-modal', className].filter(Boolean).join(' ')}
    >
      {hasHeader ? (
        <Box
          component="header"
          slot="content"
          direction="row"
          justify={hasHeading ? 'space-between' : 'flex-end'}
          align="flex-start"
          gap="var(--dq-ui-space-lg)"
          className="dq-layout-modal__header"
        >
          {hasHeading ? (
            <Box
              component="div"
              slot="content"
              gap="var(--dq-ui-space-xs)"
              className="dq-layout-modal__heading"
            >
              {title ? (
                <Title
                  id={titleId}
                  component={titleComponent}
                  variant={titleVariant}
                  className="dq-layout-modal__title"
                >
                  {title}
                </Title>
              ) : null}
              {subtitle ? (
                <p id={subtitleId} className="dq-layout-modal__subtitle">
                  {subtitle}
                </p>
              ) : null}
            </Box>
          ) : null}

          {showCloseButton ? (
            <Button
              icon={XIcon}
              ariaLabel={closeLabel}
              size="md"
              className="dq-layout-modal__close"
              popoverTarget={modalId}
              popoverTargetAction="hide"
            />
          ) : null}
        </Box>
      ) : null}

      <Box
        component="div"
        slot="content"
        gap="var(--dq-ui-space-lg)"
        className={['dq-layout-modal__body', bodyClassName].filter(Boolean).join(' ')}
      >
        {children}
      </Box>

      {hasControls ? (
        <Box
          component="footer"
          slot="content"
          direction="row"
          justify="flex-end"
          align="center"
          wrap="wrap"
          gap="var(--dq-ui-space-md)"
          className={['dq-layout-modal__controls', controlsClassName].filter(Boolean).join(' ')}
        >
          {controls}
        </Box>
      ) : null}
    </Box>
  );
};

export default Modal;
