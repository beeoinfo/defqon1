import { XIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useId, useRef } from 'react';
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
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const hasHeader = Boolean(title) || Boolean(subtitle) || showCloseButton;
  const hasControls = controls !== null && controls !== undefined && controls !== false;
  const hasHeading = Boolean(title) || Boolean(subtitle);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return undefined;
    if (open && !dialogElement.open) {
      dialogElement.showModal();
      // Empêche le focus auto sur le bouton close si ouverture par clic
      if (document.activeElement === closeBtnRef.current) {
        dialogElement.focus();
      }
    } else if (!open && dialogElement.open) {
      dialogElement.close();
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

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onClose?.();
  }, [onClose]);

  const handleClick = useCallback((event) => {
    if (!closeOnOutsideClick) {
      return;
    }

    // Click on the dialog backdrop (outside the modal box)
    if (event.target === dialogRef.current) {
      onClose?.();
    }
  }, [closeOnOutsideClick, onClose]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!open) {
    return null;
  }

  return (
    <Box
      {...props}
      ref={dialogRef}
      id={modalId}
      component="dialog"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      aria-label={title ? undefined : ariaLabel}
      background="surface-blur"
      gap="var(--dq-ui-space-lg)"
      onCancel={handleCancel}
      onClick={handleClick}
      onClose={handleClose}
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
              onClick={onClose}
              ref={closeBtnRef}
              tabIndex={0}
              onMouseDown={e => e.preventDefault()}
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
