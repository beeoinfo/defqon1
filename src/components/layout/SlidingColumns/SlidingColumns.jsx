import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Badge from '../../primitives/Badge';
import Button from '../../primitives/Button';
import Box from '../Box';
import './SlidingColumns.css';

const TOUCH_COLUMNS_MEDIA_QUERY = '(max-width: 1199.98px) and (hover: none) and (pointer: coarse)';

const getInitialTouchMode = () => (
  typeof window !== 'undefined' &&
  window.matchMedia(TOUCH_COLUMNS_MEDIA_QUERY).matches
);

const getLabelText = (label, fallback) => (
  typeof label === 'string' && label.trim().length > 0 ? label : fallback
);

const areHiddenSectionsEqual = (currentHiddenSections, nextHiddenSections, sections) => (
  sections.every((section) => Boolean(currentHiddenSections[section.id]) === Boolean(nextHiddenSections[section.id]))
);

const getNearestAvailableSectionIndex = ({
  currentIndex,
  direction,
  hiddenSections,
  sections,
}) => {
  for (
    let candidateIndex = currentIndex + direction;
    candidateIndex >= 0 && candidateIndex < sections.length;
    candidateIndex += direction
  ) {
    const candidateSection = sections[candidateIndex];

    if (candidateSection && !hiddenSections[candidateSection.id]) {
      return candidateIndex;
    }
  }

  return null;
};

const SlidingColumns = ({
  sections = [],
  variant = 'stacked',
  className = '',
  style,
  ...props
}) => {
  const frameRef = useRef(null);
  const gridShellRef = useRef(null);
  const railTrackRef = useRef(null);
  const railRef = useRef(null);
  const sectionRefs = useRef(new Map());
  const cellRefs = useRef(new Map());
  const [isTouchDevice, setIsTouchDevice] = useState(getInitialTouchMode);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null);
  const [hiddenSections, setHiddenSections] = useState({});
  const hasSections = sections.length > 0;
  const isResponsiveVariant = variant === 'responsive';
  const usesTouchColumns = isResponsiveVariant && isTouchDevice;

  useEffect(() => {
    if (!isResponsiveVariant || typeof window === 'undefined') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(TOUCH_COLUMNS_MEDIA_QUERY);
    const handleTouchModeChange = (event) => {
      setIsTouchDevice(event.matches);
    };

    setIsTouchDevice(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleTouchModeChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleTouchModeChange);
    };
  }, [isResponsiveVariant]);

  useEffect(() => {
    if (usesTouchColumns) {
      return undefined;
    }

    setActiveSectionId(sections[0]?.id ?? null);
    setHiddenSections({});

    cellRefs.current.forEach((cell) => {
      cell.classList.remove('dq-layout-sliding-columns__rail-cell--active');
      cell.classList.remove('dq-layout-sliding-columns__rail-cell--hidden');
    });

    sectionRefs.current.forEach((section) => {
      section.classList.remove('dq-layout-sliding-columns__section--active');
      section.classList.remove('dq-layout-sliding-columns__section--label-hidden');
    });

    return undefined;
  }, [usesTouchColumns]);

  useLayoutEffect(() => {
    const frameElement = frameRef.current;

    if (!frameElement || !usesTouchColumns) {
      return undefined;
    }

    const syncShellWidth = () => {
      frameElement.style.setProperty(
        '--dq-layout-sliding-columns-shell-width',
        `${frameElement.offsetWidth}px`
      );
    };

    syncShellWidth();
    window.addEventListener('resize', syncShellWidth, { passive: true });

    return () => {
      window.removeEventListener('resize', syncShellWidth);
      frameElement.style.removeProperty('--dq-layout-sliding-columns-shell-width');
    };
  }, [usesTouchColumns, sections.length]);

  useEffect(() => {
    const gridShell = gridShellRef.current;
    const railTrack = railTrackRef.current;

    if (!gridShell || !railTrack || !usesTouchColumns || !hasSections) {
      return undefined;
    }

    let frameId = 0;

    const syncRail = () => {
      frameId = 0;
      railTrack.style.transform = `translate3d(${-gridShell.scrollLeft}px, 0, 0)`;

      let activeSectionId = sections[0]?.id ?? null;
      let smallestOffset = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const sectionElement = sectionRefs.current.get(section.id);

        if (!sectionElement) {
          return;
        }

        const offset = Math.abs(sectionElement.offsetLeft - gridShell.scrollLeft);

        if (offset < smallestOffset) {
          smallestOffset = offset;
          activeSectionId = section.id;
        }
      });

      setActiveSectionId((currentActiveSectionId) => (
        currentActiveSectionId === activeSectionId ? currentActiveSectionId : activeSectionId
      ));

      sections.forEach((section) => {
        const cell = cellRefs.current.get(section.id);
        const sectionElement = sectionRefs.current.get(section.id);
        const isActive = section.id === activeSectionId;

        cell?.classList.toggle('dq-layout-sliding-columns__rail-cell--active', isActive);
        sectionElement?.classList.toggle('dq-layout-sliding-columns__section--active', isActive);
      });
    };

    const scheduleSyncRail = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(syncRail);
    };

    scheduleSyncRail();
    gridShell.addEventListener('scroll', scheduleSyncRail, { passive: true });
    window.addEventListener('resize', scheduleSyncRail, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      gridShell.removeEventListener('scroll', scheduleSyncRail);
      window.removeEventListener('resize', scheduleSyncRail);
    };
  }, [hasSections, sections, usesTouchColumns]);

  useEffect(() => {
    if (!usesTouchColumns || !hasSections) {
      return undefined;
    }

    const railElement = railRef.current;

    if (!railElement) {
      return undefined;
    }

    let frameId = 0;

    const syncTouchLabelVisibility = () => {
      frameId = 0;
      const railBottom = railElement.getBoundingClientRect().bottom;
      const nextHiddenSections = {};

      sections.forEach((section) => {
        const sectionElement = sectionRefs.current.get(section.id);
        const cell = cellRefs.current.get(section.id);

        if (!sectionElement || !cell) {
          return;
        }

        const shouldHide = sectionElement.getBoundingClientRect().bottom <= railBottom + 2;
        nextHiddenSections[section.id] = shouldHide;

        cell.classList.toggle('dq-layout-sliding-columns__rail-cell--hidden', shouldHide);
        sectionElement.classList.toggle('dq-layout-sliding-columns__section--label-hidden', shouldHide);
      });

      setHiddenSections((currentHiddenSections) => (
        areHiddenSectionsEqual(currentHiddenSections, nextHiddenSections, sections)
          ? currentHiddenSections
          : nextHiddenSections
      ));
    };

    const scheduleSyncTouchLabelVisibility = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(syncTouchLabelVisibility);
    };

    scheduleSyncTouchLabelVisibility();
    window.addEventListener('scroll', scheduleSyncTouchLabelVisibility, { passive: true });
    window.addEventListener('resize', scheduleSyncTouchLabelVisibility, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', scheduleSyncTouchLabelVisibility);
      window.removeEventListener('resize', scheduleSyncTouchLabelVisibility);
    };
  }, [hasSections, sections, usesTouchColumns]);

  useEffect(() => {
    if (usesTouchColumns || !hasSections) {
      return undefined;
    }

    let frameId = 0;

    const syncStackedLabelVisibility = () => {
      frameId = 0;

      sections.forEach((section) => {
        const sectionElement = sectionRefs.current.get(section.id);

        if (!sectionElement) {
          return;
        }

        const headerElement = sectionElement.querySelector('.dq-layout-sliding-columns__stacked-header');

        if (!headerElement) {
          return;
        }

        const shouldHide =
          sectionElement.getBoundingClientRect().bottom <=
          headerElement.getBoundingClientRect().bottom + 2;

        sectionElement.classList.toggle('dq-layout-sliding-columns__stacked-section--label-hidden', shouldHide);
      });
    };

    const scheduleSyncStackedLabelVisibility = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(syncStackedLabelVisibility);
    };

    scheduleSyncStackedLabelVisibility();
    window.addEventListener('scroll', scheduleSyncStackedLabelVisibility, { passive: true });
    window.addEventListener('resize', scheduleSyncStackedLabelVisibility, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', scheduleSyncStackedLabelVisibility);
      window.removeEventListener('resize', scheduleSyncStackedLabelVisibility);
    };
  }, [hasSections, sections, usesTouchColumns]);

  const scrollToSectionIndex = useCallback((targetIndex) => {
    const gridShell = gridShellRef.current;
    const targetSection = sections[targetIndex];
    const targetSectionElement = targetSection ? sectionRefs.current.get(targetSection.id) : null;

    if (!gridShell || !targetSectionElement) {
      return;
    }

    gridShell.scrollTo({
      left: targetSectionElement.offsetLeft,
      behavior: 'smooth',
    });
  }, [sections]);

  const touchNavigationTargets = useMemo(() => (
    sections.reduce((targetsBySectionId, section, index) => {
      targetsBySectionId[section.id] = {
        previousIndex: getNearestAvailableSectionIndex({
          currentIndex: index,
          direction: -1,
          hiddenSections,
          sections,
        }),
        nextIndex: getNearestAvailableSectionIndex({
          currentIndex: index,
          direction: 1,
          hiddenSections,
          sections,
        }),
      };

      return targetsBySectionId;
    }, {})
  ), [hiddenSections, sections]);

  const touchColumns = useMemo(() => (
    <Box
      ref={frameRef}
      className="dq-layout-sliding-columns__frame"
      style={{ '--dq-layout-sliding-columns-count': String(Math.max(sections.length, 1)) }}
    >
      <Box ref={railRef} className="dq-layout-sliding-columns__rail">
        <Box className="dq-layout-sliding-columns__rail-viewport">
          <Box
            ref={railTrackRef}
            className="dq-layout-sliding-columns__rail-track"
            aria-hidden="true"
          >
            {sections.map((section) => (
              <Box
                key={section.id}
                ref={(node) => {
                  if (node) {
                    cellRefs.current.set(section.id, node);
                    return;
                  }

                  cellRefs.current.delete(section.id);
                }}
                className="dq-layout-sliding-columns__rail-cell"
              >
                <Badge
                  variant="floating"
                  color={section.color}
                  className="dq-layout-sliding-columns__badge"
                >
                  {section.label}
                </Badge>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box ref={gridShellRef} className="dq-layout-sliding-columns__grid-shell">
        <Box className="dq-layout-sliding-columns__columns">
          {sections.map((section, index) => (
            (() => {
              const navigationTargets = touchNavigationTargets[section.id] ?? {};
              const previousIndex = navigationTargets.previousIndex;
              const nextIndex = navigationTargets.nextIndex;
              const previousSection = previousIndex !== null ? sections[previousIndex] : null;
              const nextSection = nextIndex !== null ? sections[nextIndex] : null;
              const isActiveSection = section.id === activeSectionId;

              return (
                <Box
                  key={section.id}
                  ref={(node) => {
                    if (node) {
                      sectionRefs.current.set(section.id, node);
                      return;
                    }

                    sectionRefs.current.delete(section.id);
                  }}
                  component="section"
                  className="dq-layout-sliding-columns__section"
                >
                  <h2 className="sr-only">{getLabelText(section.label, `Section ${index + 1}`)}</h2>
                  <Box className="dq-layout-sliding-columns__section-body">
                    {section.content}
                  </Box>

                  {sections.length > 1 && isActiveSection ? (
                    <Box
                      className="dq-layout-sliding-columns__mobile-nav"
                      aria-label={`${getLabelText(section.label, `Section ${index + 1}`)} navigation`}
                    >
                      <Box className="dq-layout-sliding-columns__mobile-nav-slot dq-layout-sliding-columns__mobile-nav-slot--prev">
                        {previousSection ? (
                          <Button
                            className="dq-layout-sliding-columns__mobile-nav-button"
                            icon={CaretLeftIcon}
                            radius="rounded"
                            variant="ghost"
                            onClick={() => scrollToSectionIndex(previousIndex)}
                            ariaLabel={`Scroll to ${getLabelText(previousSection.label, `section ${previousIndex + 1}`)}`}
                          >
                            {previousSection.label}
                          </Button>
                        ) : null}
                      </Box>

                      <Box className="dq-layout-sliding-columns__mobile-nav-slot dq-layout-sliding-columns__mobile-nav-slot--next">
                        {nextSection ? (
                          <Button
                            className="dq-layout-sliding-columns__mobile-nav-button"
                            icon={CaretRightIcon}
                            iconPosition="end"
                            radius="rounded"
                            variant="ghost"
                            onClick={() => scrollToSectionIndex(nextIndex)}
                            ariaLabel={`Scroll to ${getLabelText(nextSection.label, `section ${nextIndex + 1}`)}`}
                          >
                            {nextSection.label}
                          </Button>
                        ) : null}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              );
            })()
          ))}
        </Box>
      </Box>
    </Box>
  ), [activeSectionId, scrollToSectionIndex, sections, touchNavigationTargets]);

  if (!hasSections) {
    return null;
  }

  return (
    <Box
      {...props}
      className={[
        'dq-layout-sliding-columns',
        usesTouchColumns ? 'dq-layout-sliding-columns--touch' : 'dq-layout-sliding-columns--stacked',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {usesTouchColumns ? touchColumns : sections.map((section, index) => (
        <Box
          key={section.id}
          ref={(node) => {
            if (node) {
              sectionRefs.current.set(section.id, node);
              return;
            }

            sectionRefs.current.delete(section.id);
          }}
          component="section"
          className="dq-layout-sliding-columns__stacked-section"
        >
          <Box component="header" className="dq-layout-sliding-columns__stacked-header">
            <Badge
              variant="floating"
              color={section.color}
              className="dq-layout-sliding-columns__badge"
            >
              {section.label}
            </Badge>
          </Box>

          <Box className="dq-layout-sliding-columns__stacked-body">
            <h2 className="sr-only">{getLabelText(section.label, `Section ${index + 1}`)}</h2>
            {section.content}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default SlidingColumns;
