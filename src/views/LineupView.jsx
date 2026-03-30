import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Users, X } from 'lucide-react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getCanonicalStageName, getStageTheme } from '../lib/stageThemes';
import { getEntryDayLabel, getEntryDisplayName, getEntryMetaLabel } from '../lib/lineup';

const EMPTY_ITEMS = [];
const INITIAL_STAGE_PANEL_COUNT = 6;
const STAGE_PANEL_CHUNK_SIZE = 6;
const MAX_VISIBLE_TRIBE_AVATARS = 10;
const STAGE_PRIORITY_ORDER = ['BLUE', 'BLACK', 'RED', 'U.V.', 'GREEN', 'YELLOW'];
const STAGE_PRIORITY_INDEX = new Map(
  STAGE_PRIORITY_ORDER.map((stageName, index) => [stageName, index])
);

function getSuggestionCardStyle(theme, isStageChanged) {
  if (!isStageChanged) {
    return {
      borderColor: theme.accentBorder,
      background: theme.accentSoft,
    };
  }

  return {
    borderColor: theme.accentBorder,
    background: `${theme.accent}5C`,
  };
}

function compareStages(leftStage, rightStage) {
  const leftCanonical = getCanonicalStageName(leftStage);
  const rightCanonical = getCanonicalStageName(rightStage);
  const leftPriority = STAGE_PRIORITY_INDEX.get(leftCanonical);
  const rightPriority = STAGE_PRIORITY_INDEX.get(rightCanonical);

  if (leftPriority !== undefined || rightPriority !== undefined) {
    if (leftPriority === undefined) {
      return 1;
    }
    if (rightPriority === undefined) {
      return -1;
    }
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
  }

  return String(leftCanonical).localeCompare(String(rightCanonical));
}

function buildMockAvatarDataUrl(label, hue) {
  const safeLabel = String(label).slice(0, 2).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 82% 62%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 28) % 360} 78% 54%)" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="40" fill="url(#g)" />
      <text x="40" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="white">${safeLabel}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildMockTribeLikes(baseMember, count = 30) {
  const mockMembers = [
    ['Alex', 'Martin'],
    ['Camille', 'Roy'],
    ['Nina', 'Perez'],
    ['Leo', 'Garnier'],
    ['Maya', 'Dupont'],
    ['Noah', 'Petit'],
    ['Jules', 'Henry'],
    ['Emma', 'Lopez'],
    ['Lina', 'Moreau'],
    ['Tom', 'Bernard'],
    ['Iris', 'Mercier'],
    ['Sacha', 'Roux'],
    ['Yanis', 'Fischer'],
    ['Zoé', 'Marchand'],
    ['Mila', 'Chevalier'],
    ['Louis', 'Boyer'],
    ['Rose', 'Guerin'],
    ['Hugo', 'Lambert'],
    ['Chloé', 'Faure'],
    ['Nathan', 'Barbier'],
    ['Eva', 'Caron'],
    ['Paul', 'Muller'],
    ['Inès', 'Lemoine'],
    ['Lucas', 'Schmitt'],
    ['Anna', 'Perrin'],
    ['Mael', 'Robin'],
    ['Sarah', 'Colin'],
    ['Enzo', 'Picard'],
    ['Léa', 'Aubry'],
    ['Theo', 'Masson'],
  ];

  return mockMembers.slice(0, count).map(([firstName, lastName], index) => {
    const initials = `${firstName[0]}${lastName[0]}`;
    const hue = (index * 29 + 182) % 360;

    return {
      userId: `${baseMember.userId}-mock-${index}`,
      firstName,
      lastName,
      username: `${firstName}.${lastName}`.toLowerCase(),
      avatarUrl: buildMockAvatarDataUrl(initials, hue),
      isCurrentUser: false,
    };
  });
}

const LineupEntryCard = memo(
  function LineupEntryCard({
    entry,
    isFavorite,
    favoriteIdSet,
    toggleFavorite,
    canToggleFavorites,
    showTribeOnly,
    tribeLikesFromOthers,
    onOpenTribeLikes,
    relatedSuggestions,
    suggestionFavoriteSignature,
  }) {
    const displayTribeLikes = tribeLikesFromOthers;
    const tribeLikesCount = displayTribeLikes.length;
    const hasHiddenTribeLikes = tribeLikesCount > MAX_VISIBLE_TRIBE_AVATARS;
    const visibleTribeLikes = displayTribeLikes.slice(
      0,
      hasHiddenTribeLikes ? MAX_VISIBLE_TRIBE_AVATARS - 1 : MAX_VISIBLE_TRIBE_AVATARS
    );

    return (
      <article className={isFavorite ? 'entry-card entry-card--favorite' : 'entry-card'}>
        <div className="entry-card__top">
          <div>
            <h3>{getEntryDisplayName(entry)}</h3>
            <p className="muted">{entry.timeLabel}</p>
          </div>
          {canToggleFavorites ? (
            <FavoriteStar active={isFavorite} onClick={() => toggleFavorite(entry.id)} />
          ) : null}
        </div>
        {showTribeOnly && tribeLikesFromOthers.length > 0 ? (
          <div className="suggestions suggestions--tribe">
            <button
              type="button"
              className="tribe-summary-trigger"
              onClick={() => onOpenTribeLikes(entry, displayTribeLikes)}
              aria-label={`Open tribe details for ${tribeLikesCount} member${tribeLikesCount === 1 ? '' : 's'}`}
            >
              <div className="tribe-summary-trigger__avatars" aria-hidden="true">
                {visibleTribeLikes.map((member, index) => (
                  <span
                    key={member.userId}
                    className="tribe-summary-trigger__avatar-shell"
                    style={{ zIndex: visibleTribeLikes.length - index }}
                  >
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="tribe-summary-trigger__avatar"
                    />
                  </span>
                ))}
                {hasHiddenTribeLikes ? (
                  <span
                    className="tribe-summary-trigger__avatar-shell tribe-summary-trigger__avatar-shell--more"
                    style={{ zIndex: visibleTribeLikes.length + 1 }}
                  >
                    <span className="tribe-summary-trigger__more">
                      <Plus size={15} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                  </span>
                ) : null}
              </div>
            </button>
          </div>
        ) : null}
        {!showTribeOnly && isFavorite && relatedSuggestions.length > 0 ? (
          <div className="suggestions">
            <div className="suggestions__title">This artist also plays elsewhere</div>
            <div className="suggestion-list">
              {relatedSuggestions.slice(0, 3).map((suggestion) => {
                const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);
                const suggestionTheme = getStageTheme(suggestion.stageCanonical || suggestion.stage);
                const isStageChanged =
                  getCanonicalStageName(suggestion.stageCanonical || suggestion.stage) !==
                  getCanonicalStageName(entry.stageCanonical || entry.stage);

                return (
                  <div
                    key={suggestion.id}
                    className="suggestion-card"
                    style={getSuggestionCardStyle(suggestionTheme, isStageChanged)}
                  >
                    <div>
                      <strong>{getEntryDisplayName(suggestion)}</strong>
                      <p className="muted">{getEntryMetaLabel(suggestion)}</p>
                    </div>
                    {canToggleFavorites ? (
                      <FavoriteStar
                        active={isSuggestionFavorite}
                        onClick={() => toggleFavorite(suggestion.id)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </article>
    );
  },
  (previousProps, nextProps) =>
    previousProps.entry === nextProps.entry &&
    previousProps.isFavorite === nextProps.isFavorite &&
    previousProps.canToggleFavorites === nextProps.canToggleFavorites &&
    previousProps.showTribeOnly === nextProps.showTribeOnly &&
    previousProps.tribeLikesFromOthers === nextProps.tribeLikesFromOthers &&
    previousProps.onOpenTribeLikes === nextProps.onOpenTribeLikes &&
    previousProps.relatedSuggestions === nextProps.relatedSuggestions &&
    previousProps.suggestionFavoriteSignature === nextProps.suggestionFavoriteSignature &&
    previousProps.toggleFavorite === nextProps.toggleFavorite
);

function LineupView({
  groupedEntries,
  entries,
  favoriteIdSet,
  toggleFavorite,
  canToggleFavorites = true,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
  stackDays = false,
}) {
  const gridShellRef = useRef(null);
  const dayRailTrackRef = useRef(null);
  const dayRailRef = useRef(null);
  const dayColumnRefs = useRef(new Map());
  const dayCellRefs = useRef(new Map());
  const tribeLikesDrawerShellRef = useRef(null);
  const tribeLikesDrawerPanelRef = useRef(null);
  const tribeLikesDrawerSpacerRef = useRef(null);
  const tribeLikesDrawerSettleTimerRef = useRef(null);
  const tribeLikesDrawerIgnoreScrollRef = useRef(false);
  const tribeLikesDrawerOpeningRef = useRef(false);
  const [tribeLikesDrawer, setTribeLikesDrawer] = useState(null);
  const [tribeLikesDrawerClosing, setTribeLikesDrawerClosing] = useState(false);
  const hasVisibleFavorites = useMemo(
    () =>
      Object.values(groupedEntries).some((dayStages) =>
        Object.values(dayStages).some((stageEntries) =>
          stageEntries.some((entry) => favoriteIdSet.has(entry.id))
        )
      ),
    [groupedEntries, favoriteIdSet]
  );

  const alternativeEntriesById = useMemo(() => {
    if (showTribeOnly || !hasVisibleFavorites) {
      return new Map();
    }

    const entriesByToken = new Map();

    entries.forEach((entry) => {
      entry.artistTokens.forEach((token) => {
        if (!token) {
          return;
        }

        const currentEntries = entriesByToken.get(token);
        if (currentEntries) {
          currentEntries.push(entry);
          return;
        }

        entriesByToken.set(token, [entry]);
      });
    });

    return entries.reduce((accumulator, entry) => {
      const seenIds = new Set();
      const alternatives = [];

      entry.artistTokens.forEach((token) => {
        const tokenMatches = entriesByToken.get(token) ?? [];
        tokenMatches.forEach((candidate) => {
          if (candidate.id === entry.id || seenIds.has(candidate.id)) {
            return;
          }
          seenIds.add(candidate.id);
          alternatives.push(candidate);
        });
      });

      alternatives.sort(
        (a, b) =>
          (a.dayOrder ?? 999) - (b.dayOrder ?? 999) ||
          a.stage.localeCompare(b.stage)
      );

      accumulator.set(entry.id, alternatives);
      return accumulator;
    }, new Map());
  }, [entries, showTribeOnly, hasVisibleFavorites]);

  const dayEntries = useMemo(
    () =>
      Object.entries(groupedEntries).map(([day, dayStages]) => ({
        day,
        stages: Object.entries(dayStages)
          .map(([stage, stageEntries]) => ({
            key: `${day}-${stage}`,
            stage,
            stageEntries,
          }))
          .sort((leftStage, rightStage) => compareStages(leftStage.stage, rightStage.stage)),
      })),
    [groupedEntries]
  );

  const hasEntries = dayEntries.length > 0;
  const totalStagePanelCount = useMemo(
    () => dayEntries.reduce((count, dayEntry) => count + dayEntry.stages.length, 0),
    [dayEntries]
  );
  const initialRenderedStagePanelCount = useMemo(
    () => Math.min(Math.max(INITIAL_STAGE_PANEL_COUNT, dayEntries.length), totalStagePanelCount),
    [dayEntries.length, totalStagePanelCount]
  );
  const [renderedStagePanelCount, setRenderedStagePanelCount] = useState(totalStagePanelCount);
  const visibleStagePanelKeys = useMemo(() => {
    const prioritizedStagePanels = [];

    dayEntries.forEach((dayEntry) => {
      if (dayEntry.stages[0]) {
        prioritizedStagePanels.push(dayEntry.stages[0].key);
      }
    });

    dayEntries.forEach((dayEntry) => {
      dayEntry.stages.slice(1).forEach((stageEntry) => {
        prioritizedStagePanels.push(stageEntry.key);
      });
    });

    return new Set(prioritizedStagePanels.slice(0, renderedStagePanelCount));
  }, [dayEntries, renderedStagePanelCount]);
  const visibleDayEntries = useMemo(
    () =>
      dayEntries
        .map((dayEntry) => ({
          ...dayEntry,
          visibleStages: dayEntry.stages.filter((stageEntry) =>
            visibleStagePanelKeys.has(stageEntry.key)
          ),
        }))
        .filter((dayEntry) => dayEntry.visibleStages.length > 0),
    [dayEntries, visibleStagePanelKeys]
  );
  const isSingleDayView = dayEntries.length === 1;
  const useDenseEntryGrid = isSingleDayView || stackDays;
  const isTouchDrawerDevice = useCallback(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches,
    []
  );
  const showTouchDrawerChrome = isTouchDrawerDevice();

  const finalizeCloseTribeLikesDrawer = useCallback(() => {
    if (tribeLikesDrawerSettleTimerRef.current !== null) {
      window.clearTimeout(tribeLikesDrawerSettleTimerRef.current);
      tribeLikesDrawerSettleTimerRef.current = null;
    }
    tribeLikesDrawerIgnoreScrollRef.current = false;
    tribeLikesDrawerOpeningRef.current = false;
    setTribeLikesDrawer(null);
    setTribeLikesDrawerClosing(false);
  }, []);

  const openTribeLikesDrawer = useCallback((entry, likes) => {
    if (tribeLikesDrawer || tribeLikesDrawerOpeningRef.current) {
      return;
    }

    if (tribeLikesDrawerSettleTimerRef.current !== null) {
      window.clearTimeout(tribeLikesDrawerSettleTimerRef.current);
      tribeLikesDrawerSettleTimerRef.current = null;
    }
    tribeLikesDrawerOpeningRef.current = true;
    tribeLikesDrawerIgnoreScrollRef.current = false;
    setTribeLikesDrawerClosing(false);
    setTribeLikesDrawer({ entry, likes });
  }, [tribeLikesDrawer]);

  const closeTribeLikesDrawer = useCallback(() => {
    if (!tribeLikesDrawer || tribeLikesDrawerClosing || tribeLikesDrawerOpeningRef.current) {
      return;
    }

    if (!isTouchDrawerDevice()) {
      setTribeLikesDrawerClosing(true);
      tribeLikesDrawerSettleTimerRef.current = window.setTimeout(() => {
        finalizeCloseTribeLikesDrawer();
      }, 220);
      return;
    }

    const shell = tribeLikesDrawerShellRef.current;
    const spacer = tribeLikesDrawerSpacerRef.current;
    const openScrollTop = Math.max(
      0,
      spacer?.offsetHeight ?? tribeLikesDrawerPanelRef.current?.offsetHeight ?? 0
    );

    if (!shell || openScrollTop <= 0) {
      finalizeCloseTribeLikesDrawer();
      return;
    }

    setTribeLikesDrawerClosing(true);
    tribeLikesDrawerIgnoreScrollRef.current = true;
    shell.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    tribeLikesDrawerSettleTimerRef.current = window.setTimeout(() => {
      finalizeCloseTribeLikesDrawer();
    }, 280);
  }, [
    finalizeCloseTribeLikesDrawer,
    isTouchDrawerDevice,
    tribeLikesDrawer,
    tribeLikesDrawerClosing,
  ]);

  const handleTribeLikesDrawerShellScroll = useCallback(
    (event) => {
      if (!isTouchDrawerDevice() || tribeLikesDrawerClosing || tribeLikesDrawerIgnoreScrollRef.current) {
        return;
      }

      const shell = event.currentTarget;
      const panel = tribeLikesDrawerPanelRef.current;
      const spacer = tribeLikesDrawerSpacerRef.current;

      if (!panel) {
        return;
      }

      const openScrollTop = Math.max(
        0,
        spacer?.offsetHeight ?? panel.offsetHeight
      );

      if (tribeLikesDrawerSettleTimerRef.current !== null) {
        window.clearTimeout(tribeLikesDrawerSettleTimerRef.current);
      }

      tribeLikesDrawerSettleTimerRef.current = window.setTimeout(() => {
        const currentScrollTop = shell.scrollTop;

        if (currentScrollTop <= openScrollTop * 0.4) {
          closeTribeLikesDrawer();
          return;
        }

        tribeLikesDrawerIgnoreScrollRef.current = true;
        shell.scrollTo({
          top: openScrollTop,
          behavior: 'smooth',
        });

        tribeLikesDrawerSettleTimerRef.current = window.setTimeout(() => {
          tribeLikesDrawerIgnoreScrollRef.current = false;
          tribeLikesDrawerSettleTimerRef.current = null;
        }, 220);
      }, 80);
    },
    [closeTribeLikesDrawer, isTouchDrawerDevice, tribeLikesDrawerClosing]
  );

  useEffect(() => {
    setRenderedStagePanelCount(initialRenderedStagePanelCount);

    if (totalStagePanelCount <= initialRenderedStagePanelCount) {
      return undefined;
    }

    let isCancelled = false;
    let timeoutId = null;

    const scheduleNextChunk = () => {
      timeoutId = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        setRenderedStagePanelCount((currentCount) => {
          const nextCount = Math.min(currentCount + STAGE_PANEL_CHUNK_SIZE, totalStagePanelCount);

          if (nextCount < totalStagePanelCount) {
            scheduleNextChunk();
          }

          return nextCount;
        });
      }, 16);
    };

    scheduleNextChunk();

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [initialRenderedStagePanelCount, totalStagePanelCount]);

  useEffect(() => {
    const gridShell = gridShellRef.current;
    const dayRailTrack = dayRailTrackRef.current;

    if (!gridShell || !dayRailTrack || stackDays) {
      return undefined;
    }

    let frameId = null;

    const syncDayRail = () => {
      frameId = null;
      dayRailTrack.style.transform = `translate3d(${-gridShell.scrollLeft}px, 0, 0)`;

      let activeDay = visibleDayEntries[0]?.day ?? null;
      let smallestOffset = Number.POSITIVE_INFINITY;

      visibleDayEntries.forEach(({ day }) => {
        const dayColumn = dayColumnRefs.current.get(day);

        if (!dayColumn) {
          return;
        }

        const offset = Math.abs(dayColumn.offsetLeft - gridShell.scrollLeft);

        if (offset < smallestOffset) {
          smallestOffset = offset;
          activeDay = day;
        }
      });

      visibleDayEntries.forEach(({ day }) => {
        const dayCell = dayCellRefs.current.get(day);
        const dayColumn = dayColumnRefs.current.get(day);

        if (!dayCell) {
          return;
        }

        dayCell.classList.toggle('lineup-day-rail__cell--active', day === activeDay);
        dayColumn?.classList.toggle('lineup-day-column--active', day === activeDay);
      });
    };

    const scheduleSyncDayRail = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(syncDayRail);
    };

    scheduleSyncDayRail();
    gridShell.addEventListener('scroll', scheduleSyncDayRail, { passive: true });
    window.addEventListener('resize', scheduleSyncDayRail, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      gridShell.removeEventListener('scroll', scheduleSyncDayRail);
      window.removeEventListener('resize', scheduleSyncDayRail);
    };
  }, [stackDays, visibleDayEntries]);

  useEffect(() => {
    const dayRail = dayRailRef.current;

    if (!dayRail || stackDays) {
      return undefined;
    }

    let frameId = null;

    const syncDayPillVisibility = () => {
      frameId = null;
      const railBottom = dayRail.getBoundingClientRect().bottom;

      visibleDayEntries.forEach(({ day }) => {
        const dayColumn = dayColumnRefs.current.get(day);
        const dayCell = dayCellRefs.current.get(day);

        if (!dayColumn || !dayCell) {
          return;
        }

        const shouldHide = dayColumn.getBoundingClientRect().bottom <= railBottom + 2;
        dayCell.classList.toggle('lineup-day-rail__cell--hidden', shouldHide);
        dayColumn.classList.toggle('lineup-day-column--title-hidden', shouldHide);
      });
    };

    const scheduleSyncDayPillVisibility = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(syncDayPillVisibility);
    };

    scheduleSyncDayPillVisibility();
    window.addEventListener('scroll', scheduleSyncDayPillVisibility, { passive: true });
    window.addEventListener('resize', scheduleSyncDayPillVisibility, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleSyncDayPillVisibility);
      window.removeEventListener('resize', scheduleSyncDayPillVisibility);
    };
  }, [stackDays, visibleDayEntries]);

  useEffect(() => {
    if (!tribeLikesDrawer) {
      return undefined;
    }

    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const bodyOverscrollBehavior = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    if (isTouchDrawerDevice()) {
      const shell = tribeLikesDrawerShellRef.current;
      const panel = tribeLikesDrawerPanelRef.current;
      const spacer = tribeLikesDrawerSpacerRef.current;

      if (shell && panel && spacer) {
        requestAnimationFrame(() => {
          const openScrollTop = Math.max(0, panel.offsetHeight);
          spacer.style.height = `${openScrollTop}px`;
          tribeLikesDrawerIgnoreScrollRef.current = true;
          shell.scrollTop = 0;

          requestAnimationFrame(() => {
            shell.scrollTo({
              top: openScrollTop,
              behavior: 'smooth',
            });

            if (tribeLikesDrawerSettleTimerRef.current !== null) {
              window.clearTimeout(tribeLikesDrawerSettleTimerRef.current);
            }

            tribeLikesDrawerSettleTimerRef.current = window.setTimeout(() => {
              tribeLikesDrawerOpeningRef.current = false;
              tribeLikesDrawerIgnoreScrollRef.current = false;
              tribeLikesDrawerSettleTimerRef.current = null;
            }, 260);
          });
        });
      }
    }

    return () => {
      if (tribeLikesDrawerSettleTimerRef.current !== null) {
        window.clearTimeout(tribeLikesDrawerSettleTimerRef.current);
        tribeLikesDrawerSettleTimerRef.current = null;
      }

      tribeLikesDrawerOpeningRef.current = false;
      tribeLikesDrawerIgnoreScrollRef.current = false;
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.body.style.overscrollBehavior = bodyOverscrollBehavior;
    };
  }, [isTouchDrawerDevice, tribeLikesDrawer]);

  useEffect(() => {
    if (!tribeLikesDrawer) {
      return undefined;
    }

    const shell = tribeLikesDrawerShellRef.current;

    if (!shell) {
      return undefined;
    }

    const handleWheel = (event) => {
      const list = event.target.closest('.tribe-likes-drawer__list');

      if (!list) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const canScroll = list.scrollHeight > list.clientHeight;

      if (!canScroll) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const atTop = list.scrollTop <= 0;
      const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    shell.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      shell.removeEventListener('wheel', handleWheel);
    };
  }, [tribeLikesDrawer]);

  const scrollToDayIndex = useCallback(
    (targetIndex) => {
      const gridShell = gridShellRef.current;
      const targetDay = visibleDayEntries[targetIndex]?.day;
      const targetDayColumn = targetDay ? dayColumnRefs.current.get(targetDay) : null;

      if (!gridShell || !targetDayColumn) {
        return;
      }

      gridShell.scrollTo({
        left: targetDayColumn.offsetLeft,
        behavior: 'smooth',
      });
    },
    [visibleDayEntries]
  );

  const renderStagePanels = (visibleStages) =>
    visibleStages.map(({ key, stage, stageEntries }) => {
      const theme = getStageTheme(stage);

      return (
        <section
          key={key}
          className="stage-panel lineup-stage-slot"
          style={{
            borderColor: theme.accentBorder,
            background: theme.accentSoft,
          }}
        >
          <div className="stage-panel__header">
            <div className="stage-title-wrap">
              <span
                className="stage-pill"
                style={{ background: theme.accent, color: theme.activeText }}
              >
                {stage}
              </span>
            </div>
            <span>
              {stageEntries.length} {stageEntries.length === 1 ? 'artist' : 'artists'}
            </span>
          </div>
          <div
            className={
              useDenseEntryGrid
                ? 'card-list lineup-entry-list lineup-entry-list--single-day'
                : 'card-list lineup-entry-list'
            }
          >
            {stageEntries.map((entry) => {
              const isFavorite = favoriteIdSet.has(entry.id);
              const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
              const tribeLikesFromOthers = showTribeOnly
                ? tribeLikes.filter((member) => !member.isCurrentUser)
                : EMPTY_ITEMS;
              const relatedSuggestions =
                isFavorite && !showTribeOnly
                  ? (alternativeEntriesById.get(entry.id) ?? EMPTY_ITEMS)
                  : EMPTY_ITEMS;
              const suggestionFavoriteSignature = relatedSuggestions
                .slice(0, 3)
                .map(
                  (suggestion) => `${suggestion.id}:${favoriteIdSet.has(suggestion.id) ? 1 : 0}`
                )
                .join('|');

              return (
                <LineupEntryCard
                  key={entry.id}
                  entry={entry}
                  isFavorite={isFavorite}
                  favoriteIdSet={favoriteIdSet}
                  toggleFavorite={toggleFavorite}
                  canToggleFavorites={canToggleFavorites}
                  showTribeOnly={showTribeOnly}
                  tribeLikesFromOthers={tribeLikesFromOthers}
                  onOpenTribeLikes={(nextEntry, likes) =>
                    openTribeLikesDrawer(nextEntry, likes)
                  }
                  relatedSuggestions={relatedSuggestions}
                  suggestionFavoriteSignature={suggestionFavoriteSignature}
                />
              );
            })}
          </div>
        </section>
      );
    });

  if (!hasEntries) {
    return <EmptyState text="No entries found." />;
  }

  return (
    <section
      className={
        isSingleDayView
          ? 'content-grid content-grid--lineup content-grid--lineup-single-day'
          : 'content-grid content-grid--lineup'
      }
    >
      <h1 className="sr-only">Line-up</h1>
      {archiveNotice ? (
        <div className="archive-banner">
          <div className="alert-banner__icon" aria-hidden="true">
            ⚠️
          </div>
          <div className="alert-banner__content">
            <strong>Archived line-up snapshot</strong>
            <span>{archiveNotice}</span>
          </div>
        </div>
      ) : null}
      {stackDays ? (
        visibleDayEntries.map(({ day, visibleStages }) => (
          <section key={day} className="day-section day-section--stacked-lineup">
            <div className="day-section__header day-section__header--stacked-lineup">
              <h2 className="day-section__pill-heading">
                <span className="lineup-day-rail__pill">{day}</span>
              </h2>
            </div>
            <div className="day-stage-list">{renderStagePanels(visibleStages)}</div>
          </section>
        ))
      ) : (
      <div
        className="lineup-grid-frame"
        style={{ '--lineup-day-count': String(Math.max(visibleDayEntries.length, 1)) }}
      >
        <div ref={dayRailRef} className="lineup-day-rail">
          <div className="lineup-day-rail__viewport">
            <div ref={dayRailTrackRef} className="lineup-day-rail__track" aria-hidden="true">
              {visibleDayEntries.map(({ day }, index) => (
                <div
                  key={day}
                  ref={(node) => {
                    if (node) {
                      dayCellRefs.current.set(day, node);
                      return;
                    }
                    dayCellRefs.current.delete(day);
                  }}
                  className="lineup-day-rail__cell"
                >
                  <span className="lineup-day-rail__pill">{day}</span>
                  <div className="lineup-day-rail__nav-inline">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="lineup-day-rail__nav-button lineup-day-rail__nav-button--prev"
                        onClick={() => scrollToDayIndex(index - 1)}
                        aria-label={`Scroll to previous day before ${day}`}
                      >
                        <ChevronLeft size={16} />
                        <span className="lineup-day-rail__nav-label">
                          {visibleDayEntries[index - 1]?.day}
                        </span>
                      </button>
                    ) : null}
                    {index < visibleDayEntries.length - 1 ? (
                      <button
                        type="button"
                        className="lineup-day-rail__nav-button lineup-day-rail__nav-button--next"
                        onClick={() => scrollToDayIndex(index + 1)}
                        aria-label={`Scroll to next day after ${day}`}
                      >
                        <span className="lineup-day-rail__nav-label">
                          {visibleDayEntries[index + 1]?.day}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div ref={gridShellRef} className="lineup-grid-shell">
          <div className="lineup-day-columns">
            {visibleDayEntries.map(({ day, visibleStages }, index) => (
              <section
                key={day}
                ref={(node) => {
                  if (node) {
                    dayColumnRefs.current.set(day, node);
                    return;
                  }
                  dayColumnRefs.current.delete(day);
                }}
                className="lineup-day-column"
              >
                <h2 className="sr-only">{day}</h2>
                <div className="lineup-stage-list">{renderStagePanels(visibleStages)}</div>
                {visibleDayEntries.length > 1 ? (
                  <div className="lineup-mobile-nav" aria-label={`Day navigation for ${day}`}>
                    <div className="lineup-mobile-nav__slot lineup-mobile-nav__slot--prev">
                      {index > 0 ? (
                        <button
                          type="button"
                          className="lineup-mobile-nav__button"
                          onClick={() => scrollToDayIndex(index - 1)}
                          aria-label={`Scroll to ${visibleDayEntries[index - 1]?.day}`}
                        >
                          <ChevronLeft size={18} />
                          <span className="lineup-mobile-nav__label">
                            {visibleDayEntries[index - 1]?.day}
                          </span>
                        </button>
                      ) : null}
                    </div>
                    <div className="lineup-mobile-nav__slot lineup-mobile-nav__slot--next">
                      {index < visibleDayEntries.length - 1 ? (
                        <button
                          type="button"
                          className="lineup-mobile-nav__button"
                          onClick={() => scrollToDayIndex(index + 1)}
                          aria-label={`Scroll to ${visibleDayEntries[index + 1]?.day}`}
                        >
                          <span className="lineup-mobile-nav__label">
                            {visibleDayEntries[index + 1]?.day}
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
      )}
      {tribeLikesDrawer ? (
        <div
          className={
            tribeLikesDrawerClosing
              ? 'tribe-likes-drawer-backdrop tribe-likes-drawer-backdrop--closing'
              : 'tribe-likes-drawer-backdrop'
          }
          onClick={closeTribeLikesDrawer}
        >
          <div
            ref={tribeLikesDrawerShellRef}
            className="tribe-likes-drawer-shell"
            onScroll={handleTribeLikesDrawerShellScroll}
          >
            <div
              ref={tribeLikesDrawerSpacerRef}
              className="tribe-likes-drawer-shell__snap-spacer"
              aria-hidden="true"
            />
            <div className="tribe-likes-drawer-shell__viewport">
              <div
                ref={tribeLikesDrawerPanelRef}
                className={
                  tribeLikesDrawerClosing
                    ? 'modal-panel tribe-likes-drawer tribe-likes-drawer--closing'
                    : 'modal-panel tribe-likes-drawer'
                }
                onClick={(event) => event.stopPropagation()}
              >
                {showTouchDrawerChrome ? (
                  <div className="tribe-likes-drawer__handle" aria-hidden="true" />
                ) : null}
                <div className="modal-panel__header tribe-likes-drawer__header">
                  <div className="tribe-likes-drawer__header-content">
                    <h2>{getEntryDisplayName(tribeLikesDrawer.entry)}</h2>
                    <p className="muted">
                      {[getEntryDayLabel(tribeLikesDrawer.entry), tribeLikesDrawer.entry.stage]
                        .filter(Boolean)
                        .join(' \u2022 ')}
                    </p>
                    <p className="muted">{tribeLikesDrawer.entry.timeLabel}</p>
                  </div>
                  {!showTouchDrawerChrome ? (
                    <button
                      type="button"
                      className="tribe-likes-drawer__close"
                      onClick={closeTribeLikesDrawer}
                      aria-label="Close tribe drawer"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
                <p className="muted tribe-likes-drawer__summary">
                  {tribeLikesDrawer.likes.length} member
                  {tribeLikesDrawer.likes.length === 1 ? '' : 's'} of your tribe
                  {tribeLikesDrawer.likes.length === 1 ? ' is' : ' are'} already hyped.
                </p>
                <div className="tribe-likes-drawer__list-shell">
                  <div className="tribe-likes-drawer__list">
                    {tribeLikesDrawer.likes.map((member) => {
                      const fullName = [member.firstName, member.lastName]
                        .filter(Boolean)
                        .join(' ')
                        .trim();
                      const usernameLabel = String(member.username ?? '').trim();
                      return (
                        <div key={member.userId} className="tribe-like-card tribe-like-card--drawer">
                          <img
                            src={member.avatarUrl}
                            alt={fullName || 'Tribe member'}
                            className="tribe-like-card__avatar"
                          />
                          <div className="tribe-like-card__name">
                            <strong>{fullName || 'Tribe member'}</strong>
                            <span>{usernameLabel ? `@${usernameLabel}` : 'Profile unavailable'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default memo(LineupView);
