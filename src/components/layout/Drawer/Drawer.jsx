import { XIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { lockDocumentScroll, unlockDocumentScroll } from '../../../lib/documentScrollLock';
import Box from '@/components/layout/Box';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import './Drawer.css';

const DRAWER_ANIMATION_MS = 180;
const TOUCH_DRAWER_MEDIA_QUERY = '(hover: none) and (pointer: coarse)';
const DRAWER_CLOSE_THRESHOLD_MIN = 72;
const DRAWER_CLOSE_THRESHOLD_MAX = 160;
const DRAWER_CLOSE_THRESHOLD_RATIO = 0.25;

const Drawer = ({
  open = false,
  onClose,
  title,
  subtitle,
  description,
  titleComponent = 'h2',
  titleVariant = 'h3',
  meta1,
  meta2,
  meta3,
  metaVariant,
  ariaLabel = 'Drawer',
  closeLabel = 'Close drawer',
  closeOnOutsideClick = true,
  showCloseButton = true,
  maxWidth = '720px',
  className = '',
  bodyClassName = '',
  children,
  style,
  ...props
}) => {
  const generatedId = useId();
  const sanitizedId = generatedId.replace(/[^a-zA-Z0-9_-]/g, '');
  const drawerId = `dq-layout-drawer-${sanitizedId}`;
  const titleId = title ? `${drawerId}-title` : undefined;
  const subtitleId = subtitle ? `${drawerId}-subtitle` : undefined;
  const drawerRef = useRef(null);
  const panelRef = useRef(null);
  const headerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeTimeoutRef = useRef(0);
  const openFrameRef = useRef(0);
  const startedOutsidePointerRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragPointerIdRef = useRef(null);
  const isDraggingRef = useRef(false);
  const shouldIgnoreClickRef = useRef(false);
  const dragListenersRef = useRef({
    move: null,
    end: null,
  });
  const [drawerState, setDrawerState] = useState(open ? 'open' : 'closed');
  const isTouchDrawerDevice =
    typeof window !== 'undefined' &&
    window.matchMedia(TOUCH_DRAWER_MEDIA_QUERY).matches;
  const hasHeading = Boolean(title) || Boolean(subtitle);
  const shouldShowCloseButton = showCloseButton && !isTouchDrawerDevice;
  const hasHeader = Boolean(title) || Boolean(subtitle) || shouldShowCloseButton;
  const isDrawerVisible = drawerState !== 'closed';
  const metaParts = [meta1, meta2, meta3].filter(Boolean);
  const hasMeta = metaParts.length > 0;

  const setDragOffset = useCallback((nextOffset) => {
    const clampedOffset = Math.max(nextOffset, 0);

    dragOffsetRef.current = clampedOffset;
    drawerRef.current?.style.setProperty('--dq-layout-drawer-drag-offset', `${clampedOffset}px`);
  }, []);

  const removeDragListeners = () => {
    const { move, end } = dragListenersRef.current;

    if (move) {
      window.removeEventListener('pointermove', move);
    }

    if (end) {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    }

    dragListenersRef.current = {
      move: null,
      end: null,
    };
  };

  const stopDragging = useCallback(() => {
    isDraggingRef.current = false;
    dragPointerIdRef.current = null;
    drawerRef.current?.removeAttribute('data-dragging');
    removeDragListeners();
  }, []);

  useLayoutEffect(() => {
    const drawerElement = drawerRef.current;

    if (!drawerElement) {
      return undefined;
    }

    window.clearTimeout(closeTimeoutRef.current);
    window.cancelAnimationFrame(openFrameRef.current);

    if (open) {
      setDragOffset(0);

      if (!drawerElement.open) {
        drawerElement.showModal();
      }

      setDrawerState('opening');
      openFrameRef.current = window.requestAnimationFrame(() => {
        if (drawerRef.current && document.activeElement === closeButtonRef.current) {
          drawerRef.current.focus({ preventScroll: true });
        }

        setDrawerState('open');
      });
    } else if (drawerElement.open) {
      stopDragging();
      setDrawerState('closing');
      closeTimeoutRef.current = window.setTimeout(() => {
        drawerElement.close();
        setDrawerState('closed');
        setDragOffset(0);
      }, DRAWER_ANIMATION_MS);
    } else {
      setDrawerState('closed');
      setDragOffset(0);
    }

    return undefined;
  }, [open, setDragOffset, stopDragging]);

  useEffect(() => (
    () => {
      window.clearTimeout(closeTimeoutRef.current);
      window.cancelAnimationFrame(openFrameRef.current);
      stopDragging();

      if (drawerRef.current?.open) {
        drawerRef.current.close();
      }
    }
  ), [stopDragging]);

  useEffect(() => {
    if (!isDrawerVisible) {
      return undefined;
    }

    lockDocumentScroll();

    return () => {
      unlockDocumentScroll();
    };
  }, [isDrawerVisible]);

  const handleCancel = useCallback((event) => {
    event.preventDefault();
    onClose?.();
  }, [onClose]);

  const handleClick = useCallback((event) => {
    if (shouldIgnoreClickRef.current) {
      shouldIgnoreClickRef.current = false;
      startedOutsidePointerRef.current = false;
      return;
    }

    const shouldCloseFromOutsideClick =
      closeOnOutsideClick &&
      startedOutsidePointerRef.current &&
      event.target === drawerRef.current;

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

  const handlePointerDown = useCallback((event) => {
    startedOutsidePointerRef.current = event.target === drawerRef.current;

    if (!isTouchDrawerDevice || !open || event.pointerType === 'mouse') {
      return;
    }

    const isHeaderTarget = headerRef.current?.contains(event.target);
    const isOutsideTarget = event.target === drawerRef.current;

    if (!isHeaderTarget && !isOutsideTarget) {
      return;
    }

    event.preventDefault();
    shouldIgnoreClickRef.current = false;
    isDraggingRef.current = true;
    dragPointerIdRef.current = event.pointerId;
    dragStartYRef.current = event.clientY - dragOffsetRef.current;
    drawerRef.current?.setAttribute('data-dragging', 'true');

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingRef.current || moveEvent.pointerId !== dragPointerIdRef.current) {
        return;
      }

      moveEvent.preventDefault();

      const nextOffset = Math.max(moveEvent.clientY - dragStartYRef.current, 0);

      if (nextOffset > 4) {
        shouldIgnoreClickRef.current = true;
      }

      setDragOffset(nextOffset);
    };

    const handlePointerEnd = (endEvent) => {
      if (!isDraggingRef.current || endEvent.pointerId !== dragPointerIdRef.current) {
        return;
      }

      endEvent.preventDefault();

      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 0;
      const closeThreshold = Math.min(
        Math.max(panelHeight * DRAWER_CLOSE_THRESHOLD_RATIO, DRAWER_CLOSE_THRESHOLD_MIN),
        DRAWER_CLOSE_THRESHOLD_MAX
      );
      const shouldClose = dragOffsetRef.current >= closeThreshold;

      stopDragging();

      if (shouldClose) {
        onClose?.();
        return;
      }

      setDragOffset(0);
    };

    dragListenersRef.current = {
      move: handlePointerMove,
      end: handlePointerEnd,
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd, { passive: false });
    window.addEventListener('pointercancel', handlePointerEnd, { passive: false });
  }, [isTouchDrawerDevice, onClose, open, setDragOffset, stopDragging]);

  return (
    <Box
      {...props}
      ref={drawerRef}
      id={drawerId}
      component="dialog"
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      aria-label={title ? undefined : ariaLabel}
      onCancel={handleCancel}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      data-state={drawerState}
      style={{
        '--dq-layout-drawer-width': maxWidth,
        '--dq-layout-drawer-animation-duration': `${DRAWER_ANIMATION_MS}ms`,
        '--dq-layout-drawer-drag-offset': '0px',
        ...style,
      }}
      className={['dq-layout-drawer', className].filter(Boolean).join(' ')}
    >
      <Box
        ref={panelRef}
        component="section"
        background="surface-ghost-blur"
        gap="var(--dq-ui-space-lg)"
        className="dq-layout-drawer__panel"
      >
        {hasHeader ? (
          <Box
            ref={headerRef}
            component="header"
            slot="content"
            className="dq-layout-drawer__header"
          >
            <Box
              direction="row"
              justify={hasHeading ? 'space-between' : 'flex-end'}
              align="flex-start"
              gap="var(--dq-ui-space-lg)"
            >
              {hasHeading ? (
                <Box
                  component="div"
                  slot="content"
                  gap="var(--dq-ui-space-xs)"
                  className="dq-layout-drawer__heading"
                >
                  {title ? (
                    <Title
                      id={titleId}
                      component={titleComponent}
                      variant={titleVariant}
                      className="dq-layout-drawer__title"
                    >
                      {title}
                    </Title>
                  ) : null}
                  {hasMeta ? (
                    <Box
                      component="div"
                      slot="content"
                      direction="row"
                      wrap="wrap"
                      align="center"
                      gap="2px 0"
                      className={[
                        'dq-layout-drawer__meta',
                        metaVariant === 'strikethrough' ? 'dq-layout-drawer__meta--strikethrough' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {metaParts.map((part, index) => (
                        <span key={index} className="dq-layout-drawer__meta-item">{part}</span>
                      ))}
                    </Box>
                  ) : null}
                  {subtitle ? (
                    <p id={subtitleId} className="dq-layout-drawer__subtitle">
                      {subtitle}
                    </p>
                  ) : null}
                </Box>
              ) : null}
              {shouldShowCloseButton ? (
                <Button
                  icon={XIcon}
                  ariaLabel={closeLabel}
                  size="md"
                  className="dq-layout-drawer__close"
                  ref={closeButtonRef}
                  onClick={handleClose}
                />
              ) : null}
            </Box>

            {description ? (
              <>
                <hr className="dq-layout-drawer__divider" />
                <p className="dq-layout-drawer__description">{description}</p>
              </>
            ) : null}
          </Box>
        ) : null}

        <Box
          component="div"
          slot="content"
          gap="var(--dq-ui-space-lg)"
          className={['dq-layout-drawer__body', bodyClassName].filter(Boolean).join(' ')}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Drawer;
