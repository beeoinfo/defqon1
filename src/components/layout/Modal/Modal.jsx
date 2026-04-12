import { XIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { lockDocumentScroll, unlockDocumentScroll } from '../../../lib/documentScrollLock';
import Box from '../Box';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import './Modal.css';

const MODAL_ANIMATION_MS = 180;

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
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeTimeoutRef = useRef(0);
  const openFrameRef = useRef(0);
  const startedOutsidePointerRef = useRef(false);
  const [dialogState, setDialogState] = useState(open ? 'open' : 'closed');
  const hasHeader = Boolean(title) || Boolean(subtitle) || showCloseButton;
  const hasControls = controls !== null && controls !== undefined && controls !== false;
  const hasHeading = Boolean(title) || Boolean(subtitle);
  const isDialogVisible = dialogState !== 'closed';

  useLayoutEffect(() => {
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return undefined;
    }

    window.clearTimeout(closeTimeoutRef.current);
    window.cancelAnimationFrame(openFrameRef.current);

    if (open) {
      if (!dialogElement.open) {
        dialogElement.showModal();
      }

      setDialogState('opening');
      openFrameRef.current = window.requestAnimationFrame(() => {
        if (dialogRef.current && document.activeElement === closeButtonRef.current) {
          dialogRef.current.focus({ preventScroll: true });
        }

        setDialogState('open');
      });
    } else if (dialogElement.open) {
      setDialogState('closing');
      closeTimeoutRef.current = window.setTimeout(() => {
        dialogElement.close();
        setDialogState('closed');
      }, MODAL_ANIMATION_MS);
    } else {
      setDialogState('closed');
    }

    return undefined;
  }, [open]);

  useEffect(() => (
    () => {
      window.clearTimeout(closeTimeoutRef.current);
      window.cancelAnimationFrame(openFrameRef.current);

      if (dialogRef.current?.open) {
        dialogRef.current.close();
      }
    }
  ), []);

  useEffect(() => {
    if (!isDialogVisible) {
      return undefined;
    }

    lockDocumentScroll();

    return () => {
      unlockDocumentScroll();
    };
  }, [isDialogVisible]);

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onClose?.();
  }, [onClose]);

  const handlePointerDown = useCallback((event) => {
    startedOutsidePointerRef.current = event.target === dialogRef.current;
  }, []);

  const handleClick = useCallback((event) => {
    const shouldCloseFromOutsideClick =
      closeOnOutsideClick &&
      startedOutsidePointerRef.current &&
      event.target === dialogRef.current;

    startedOutsidePointerRef.current = false;

    if (!closeOnOutsideClick) {
      return;
    }

    if (shouldCloseFromOutsideClick) {
      onClose?.();
    }
  }, [closeOnOutsideClick, onClose]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <Box
      {...props}
      ref={dialogRef}
      id={modalId}
      component="dialog"
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      aria-label={title ? undefined : ariaLabel}
      background="surface-blur"
      gap="var(--dq-ui-space-lg)"
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      data-state={dialogState}
      style={{
        '--dq-layout-modal-width': maxWidth,
        '--dq-layout-modal-animation-duration': `${MODAL_ANIMATION_MS}ms`,
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
              ref={closeButtonRef}
              onClick={handleClose}
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
