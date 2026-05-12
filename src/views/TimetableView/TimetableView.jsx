import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HeartIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import Box from '@/components/layout/Box';
import Drawer from '@/components/layout/Drawer';
import PeopleCard from '@/components/PeopleCard';
import PeopleStack from '@/components/PeopleStack';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import ToggleButton from '@/components/primitives/ToggleButton';
import {
  compareLineupEntries,
  getEntryDayLabel,
  getEntryDisplayName,
  getEntryMetaLabel,
  getEntryTimeLabel,
} from '@/lib/lineup';
import { getStageTheme } from '@/lib/stageThemes';
import './TimetableView.css';

const HALF_HOUR_HEIGHT = 68;
const DEFAULT_HOUR_HEIGHT = HALF_HOUR_HEIGHT * 2;
const MIN_HOUR_HEIGHT = 1;
const MIN_ENTRY_HEIGHT_EXTRA_REM = 0.25;
const COMPACT_ENTRY_MAX_MINUTES = 45;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const MAX_VISIBLE_TRIBE_AVATARS = 6;
const STYLE_TAG_BADGE_BACKGROUND = 'rgba(56, 189, 248, 0.12)';
const STYLE_TAG_BADGE_BORDER = 'rgba(56, 189, 248, 0.36)';
const STYLE_TAG_BADGE_TEXT = '#7dd3fc';
const ADDITIONAL_STYLE_TAG_BADGE_BACKGROUND = 'rgba(251, 191, 36, 0.13)';
const ADDITIONAL_STYLE_TAG_BADGE_BORDER = 'rgba(251, 191, 36, 0.4)';
const ADDITIONAL_STYLE_TAG_BADGE_TEXT = '#fcd34d';

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const labelsMatch = (leftValue, rightValue) => (
  String(leftValue ?? '').trim().toLowerCase() === String(rightValue ?? '').trim().toLowerCase()
);

const floorToHour = (timestamp) => Math.floor(timestamp / MS_PER_HOUR) * MS_PER_HOUR;
const ceilToHour = (timestamp) => Math.ceil(timestamp / MS_PER_HOUR) * MS_PER_HOUR;
const formatTime = (timestamp) => TIME_FORMATTER.format(new Date(timestamp));

const formatDuration = (startTimestamp, endTimestamp) => {
  const totalMinutes = Math.max(Math.round((endTimestamp - startTimestamp) / MS_PER_MINUTE), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}min`;
};

const getStageSortValue = (stage) => (
  (stage.entries[0]?.stageOrder ?? 999) ||
  String(stage.label ?? '').localeCompare(String(stage.label ?? ''))
);

const getPixelValue = (value) => Number.parseFloat(value) || 0;

const getMemberDisplayName = (member) => (
  [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || 'Tribe member'
);

const renderStyleBadges = (styleTags) => {
  if (!styleTags?.length) {
    return null;
  }

  return (
    <Box
      className="dq-timetable-view__style-tags"
      direction="row"
      wrap="wrap"
      gap="4px"
    >
      {styleTags.map((styleTag) => {
        const label = typeof styleTag === 'string' ? styleTag : styleTag.label;
        const isAdditional = typeof styleTag === 'object' && styleTag.kind === 'additional';

        return (
          <Badge
            key={`${isAdditional ? 'additional' : 'main'}-${label}`}
            size="sm"
            variant="ghost"
            backgroundColor={isAdditional ? ADDITIONAL_STYLE_TAG_BADGE_BACKGROUND : STYLE_TAG_BADGE_BACKGROUND}
            borderColor={isAdditional ? ADDITIONAL_STYLE_TAG_BADGE_BORDER : STYLE_TAG_BADGE_BORDER}
            textColor={isAdditional ? ADDITIONAL_STYLE_TAG_BADGE_TEXT : STYLE_TAG_BADGE_TEXT}
            translate="no"
          >
            {label}
          </Badge>
        );
      })}
    </Box>
  );
};

const buildTimetableData = ({ entries, selectedDay, hourHeight }) => {
  const scheduledEntries = entries
    .map((entry) => {
      const startTimestamp = parseTimestamp(entry.startAt);
      const endTimestamp = parseTimestamp(entry.endAt);

      if (startTimestamp === null || endTimestamp === null || endTimestamp <= startTimestamp) {
        return null;
      }

      return {
        ...entry,
        startTimestamp,
        endTimestamp,
      };
    })
    .filter(Boolean)
    .filter((entry) => labelsMatch(getEntryDayLabel(entry), selectedDay))
    .sort(compareLineupEntries);

  if (scheduledEntries.length === 0) {
    return {
      entries: [],
      stages: [],
      hourMarkers: [],
      rangeStart: null,
      rangeEnd: null,
      timelineHeight: 0,
    };
  }

  const rangeStart = floorToHour(Math.min(...scheduledEntries.map((entry) => entry.startTimestamp)));
  const rangeEnd = ceilToHour(Math.max(...scheduledEntries.map((entry) => entry.endTimestamp)));
  const totalHours = Math.max((rangeEnd - rangeStart) / MS_PER_HOUR, 1);
  const timelineHeight = Math.round(totalHours * hourHeight);
  const hourMarkers = Array.from({ length: totalHours + 1 }, (_, index) => {
    const timestamp = rangeStart + (index * MS_PER_HOUR);

    return {
      id: timestamp,
      label: formatTime(timestamp),
      top: Math.round(index * hourHeight),
    };
  });
  const stagesByKey = new Map();

  scheduledEntries.forEach((entry) => {
    const stageLabel = entry.stageCanonical ?? entry.stage ?? 'Unknown stage';
    const stageKey = stageLabel;
    const stageTheme = getStageTheme(stageLabel);
    const stageColor = entry.stageColor ?? stageTheme.accent;

    if (!stagesByKey.has(stageKey)) {
      stagesByKey.set(stageKey, {
        id: stageKey,
        label: stageLabel,
        color: stageColor,
        entries: [],
      });
    }

    const stage = stagesByKey.get(stageKey);
    const durationMinutes = Math.round((entry.endTimestamp - entry.startTimestamp) / MS_PER_MINUTE);

    stage.entries.push({
      ...entry,
      top: Math.round(((entry.startTimestamp - rangeStart) / MS_PER_HOUR) * hourHeight),
      height: Math.max(
        Math.round(((entry.endTimestamp - entry.startTimestamp) / MS_PER_HOUR) * hourHeight),
        1
      ),
      durationMinutes,
      displayName: getEntryDisplayName(entry),
      displayTime: getEntryTimeLabel(entry),
      displayDuration: formatDuration(entry.startTimestamp, entry.endTimestamp),
      isCompact: durationMinutes <= COMPACT_ENTRY_MAX_MINUTES,
    });
  });

  return {
    entries: scheduledEntries,
    stages: Array.from(stagesByKey.values()).sort(
      (leftStage, rightStage) =>
        getStageSortValue(leftStage) - getStageSortValue(rightStage) ||
        String(leftStage.label).localeCompare(String(rightStage.label))
    ),
    hourMarkers,
    rangeStart,
    rangeEnd,
    timelineHeight,
  };
};

const TimetableView = ({
  hasLineup = true,
  entries = [],
  selectedDay = '',
  favoriteIdSet = new Set(),
  toggleFavorite,
  canToggleFavorites = true,
  canEditLineup = false,
  onEditEntry = null,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
  archiveNoticeTitle = 'Archived line-up snapshot',
  filterBar = null,
  showStyleTags = false,
  styleTagsByEntryId = new Map(),
}) => {
  const [selectedTribeEntry, setSelectedTribeEntry] = useState(null);
  const shellRef = useRef(null);
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const measurementKey = useMemo(
    () => [
      selectedDay,
      entries
        .map((entry) => [
          entry.id,
          entry.stageCanonical,
          entry.stage,
          entry.startAt,
          entry.endAt,
          showStyleTags
            ? (styleTagsByEntryId.get(entry.id) ?? []).map((styleTag) => styleTag.label).join(',')
            : '',
          (tribeLikesByEntryId.get(entry.id) ?? []).length,
          getEntryDisplayName(entry),
        ].join(':'))
        .join('|'),
    ].join('::'),
    [entries, selectedDay, showStyleTags, styleTagsByEntryId, tribeLikesByEntryId]
  );
  const [hourHeightState, setHourHeightState] = useState(null);
  const hasMeasuredHourHeight = hourHeightState?.key === measurementKey;
  const resolvedHourHeight = hasMeasuredHourHeight ? hourHeightState.value : DEFAULT_HOUR_HEIGHT;
  const timetableData = useMemo(
    () => buildTimetableData({ entries, selectedDay, hourHeight: resolvedHourHeight }),
    [entries, resolvedHourHeight, selectedDay]
  );

  const syncScrollPosition = (sourceElement, targetElement) => {
    if (!sourceElement || !targetElement || targetElement.scrollLeft === sourceElement.scrollLeft) {
      return;
    }

    targetElement.scrollLeft = sourceElement.scrollLeft;
  };

  const handleHeaderScroll = (event) => {
    syncScrollPosition(event.currentTarget, bodyScrollRef.current);
  };

  const handleBodyScroll = (event) => {
    syncScrollPosition(event.currentTarget, headerScrollRef.current);
  };

  useLayoutEffect(() => {
    syncScrollPosition(bodyScrollRef.current, headerScrollRef.current);
  }, [selectedDay, timetableData.stages.length]);

  useLayoutEffect(() => {
    const shellElement = shellRef.current;

    if (!shellElement) {
      return undefined;
    }

    let animationFrameId = null;

    const getMeasuredHourHeight = () => {
      const measurementEntryElements = Array.from(
        shellElement.querySelectorAll('.dq-timetable-view__entry--measurement')
      );

      const requiredHourHeight = measurementEntryElements.reduce((largestRequiredHourHeight, entryElement) => {
        const durationMinutes = Number(entryElement.dataset.durationMinutes);

        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          return largestRequiredHourHeight;
        }

        const styles = window.getComputedStyle(entryElement);
        const contentElement = entryElement.querySelector('.dq-timetable-view__entry-content');
        const favoriteElement = entryElement.querySelector('.dq-timetable-view__favorite');
        const rootFontSize = getPixelValue(
          window.getComputedStyle(document.documentElement).fontSize
        );
        const minEntryHeightExtra = rootFontSize * MIN_ENTRY_HEIGHT_EXTRA_REM;
        const paddingBlockSize = getPixelValue(styles.paddingTop) + getPixelValue(styles.paddingBottom);
        const borderBlockSize =
          getPixelValue(styles.borderTopWidth) + getPixelValue(styles.borderBottomWidth);
        const contentRequiredHeight = contentElement?.scrollHeight ?? 0;
        const favoriteRequiredHeight = favoriteElement
          ? favoriteElement.offsetTop + favoriteElement.offsetHeight + getPixelValue(styles.paddingBottom)
          : 0;
        const requiredEntryHeight = Math.ceil(
          Math.max(contentRequiredHeight + paddingBlockSize, favoriteRequiredHeight) +
          borderBlockSize +
          minEntryHeightExtra
        );
        const entryGapBlock = getPixelValue(
          styles.getPropertyValue('--dq-timetable-entry-gap-block')
        );
        const requiredEntryHourHeight =
          ((requiredEntryHeight + entryGapBlock) / durationMinutes) * 60;

        return Math.max(largestRequiredHourHeight, requiredEntryHourHeight);
      }, MIN_HOUR_HEIGHT);
      return Math.max(Math.ceil(requiredHourHeight), MIN_HOUR_HEIGHT);
    };

    const commitHourHeight = (nextHourHeight) => {
      setHourHeightState((currentState) => (
        currentState?.key === measurementKey && Math.abs(currentState.value - nextHourHeight) <= 1
          ? currentState
          : { key: measurementKey, value: nextHourHeight }
      ));
    };

    const updateHourHeight = () => {
      commitHourHeight(getMeasuredHourHeight());
    };

    const scheduleUpdateHourHeight = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(updateHourHeight);
    };

    const resizeObserver = new ResizeObserver(scheduleUpdateHourHeight);
    resizeObserver.observe(shellElement);
    updateHourHeight();

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      resizeObserver.disconnect();
    };
  }, [favoriteIdSet, measurementKey, timetableData.stages]);

  const renderTribeStack = (entry) => {
    const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
    const tribeLikesFromOthers = tribeLikes.filter((member) => !member.isCurrentUser);

    if (tribeLikesFromOthers.length === 0) {
      return null;
    }

    return (
      <PeopleStack
        avatars={tribeLikesFromOthers}
        maxVisible={MAX_VISIBLE_TRIBE_AVATARS}
        className="dq-timetable-view__people-stack"
        ariaLabel={`Open tribe details for ${tribeLikesFromOthers.length} member${tribeLikesFromOthers.length === 1 ? '' : 's'}`}
        onClick={() => setSelectedTribeEntry({ entry, likes: tribeLikesFromOthers })}
      />
    );
  };

  return (
    <Box className="dq-timetable-view" gap="0">
      {filterBar ? <FilterBar {...filterBar} /> : null}

      <Box gap="var(--dq-ui-space-xl)">
        {archiveNotice ? (
          <Alert variant="warning" title={archiveNoticeTitle}>
            {archiveNotice}
          </Alert>
        ) : null}

        {timetableData.stages.length === 0 ? (
          <EmptyState
            text={hasLineup ? 'No scheduled artists match the current filters.' : 'No lineup has been loaded yet.'}
          />
        ) : (
          <Box
            ref={shellRef}
            className="dq-timetable-view__shell"
            gap="0"
            style={{
              '--dq-timetable-stage-count': timetableData.stages.length,
              '--dq-timetable-timeline-height': `${timetableData.timelineHeight}px`,
              '--dq-timetable-hour-height': `${resolvedHourHeight}px`,
            }}
          >
            <Box
              className="dq-timetable-view__measurement-grid"
              aria-hidden="true"
              style={{
                gridTemplateColumns:
                  'var(--dq-timetable-time-axis-width) repeat(var(--dq-timetable-stage-count), var(--dq-timetable-stage-column-width))',
              }}
            >
              {timetableData.stages.map((stage, stageIndex) => (
                <Box
                  key={stage.id}
                  className="dq-timetable-view__measurement-column"
                  style={{
                    gridColumn: stageIndex + 2,
                    '--dq-timetable-stage-color': stage.color,
                  }}
                >
                  {stage.entries.map((entry) => {
                    const isFavorite = favoriteIdSet.has(entry.id);

                    return (
                      <Box
                        key={entry.id}
                        component="article"
                        className={[
                          'dq-timetable-view__entry',
                          'dq-timetable-view__entry--measurement',
                          entry.isCompact ? 'dq-timetable-view__entry--compact' : '',
                        ].filter(Boolean).join(' ')}
                        data-duration-minutes={entry.durationMinutes}
                      >
                        <Box
                          className="dq-timetable-view__entry-content"
                          gap="0.125rem"
                        >
                          <span className="dq-timetable-view__entry-name" translate="no">
                            {entry.displayName}
                          </span>
                          {showStyleTags ? renderStyleBadges(styleTagsByEntryId.get(entry.id)) : null}
                          <span className="dq-timetable-view__entry-time">
                            {entry.displayTime}{' '}
                            <span className="dq-timetable-view__entry-duration">
                              ({entry.displayDuration})
                            </span>
                          </span>
                          {renderTribeStack(entry)}
                        </Box>

                        {canEditLineup ? (
                          <Button
                            className="dq-timetable-view__favorite"
                            variant="ghost"
                            icon={PencilSimpleIcon}
                            size="sm"
                            radius="rounded"
                            ariaLabel={`Edit ${entry.displayName}`}
                          />
                        ) : canToggleFavorites ? (
                          <ToggleButton
                            className="dq-timetable-view__favorite"
                            variant="likes"
                            icon={HeartIcon}
                            size="sm"
                            radius="rounded"
                            pressed={isFavorite}
                            fillOnPress
                            ariaLabel={isFavorite ? 'Remove favorite' : 'Add favorite'}
                          />
                        ) : isFavorite ? (
                          <span className="dq-timetable-view__favorite dq-timetable-view__favorite--readonly" aria-label="Liked">
                            <HeartIcon weight="fill" />
                          </span>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>

            {hasMeasuredHourHeight ? (
              <>
                <Box className="dq-timetable-view__left-rail" aria-hidden="true">
                  {timetableData.hourMarkers.map((marker) => (
                    <time
                      key={marker.id}
                      className="dq-timetable-view__time-marker"
                      dateTime={new Date(marker.id).toISOString()}
                      style={{ '--dq-timetable-marker-top': `${marker.top}px` }}
                    >
                      {marker.label}
                    </time>
                  ))}
                </Box>

                <Box className="dq-timetable-view__sticky-head" gap="0">
              <Box
                ref={headerScrollRef}
                className="dq-timetable-view__header-scroll"
                onScroll={handleHeaderScroll}
              >
                <Box
                  className="dq-timetable-view__header-grid"
                  style={{
                    gridTemplateColumns:
                      'var(--dq-timetable-time-axis-width) repeat(var(--dq-timetable-stage-count), var(--dq-timetable-stage-column-width))',
                  }}
                >
                  <Box
                    className="dq-timetable-view__corner"
                    align="center"
                    justify="center"
                    aria-hidden="true"
                  />

                  {timetableData.stages.map((stage, stageIndex) => (
                    <Box
                      key={stage.id}
                      className="dq-timetable-view__stage-header"
                      style={{
                        gridColumn: stageIndex + 2,
                        '--dq-timetable-stage-color': stage.color,
                      }}
                    >
                      <span className="dq-timetable-view__stage-name" translate="no">{stage.label}</span>
                      <span className="dq-timetable-view__stage-count">
                        {stage.entries.length} show{stage.entries.length === 1 ? '' : 's'}
                      </span>
                    </Box>
                  ))}
                </Box>
              </Box>
                </Box>

                <Box
                  ref={bodyScrollRef}
                  className="dq-timetable-view__scroll"
                  onScroll={handleBodyScroll}
                >
              <Box
                className="dq-timetable-view__grid"
                style={{
                  gridTemplateColumns:
                    'var(--dq-timetable-time-axis-width) repeat(var(--dq-timetable-stage-count), var(--dq-timetable-stage-column-width))',
                }}
              >
                {timetableData.stages.map((stage, stageIndex) => (
                  <Box
                    key={stage.id}
                    className="dq-timetable-view__stage-column"
                    style={{
                      gridColumn: stageIndex + 2,
                      '--dq-timetable-stage-color': stage.color,
                    }}
                  >
                    {stage.entries.map((entry) => {
                      const isFavorite = favoriteIdSet.has(entry.id);

                      return (
                        <Box
                          key={entry.id}
                          component="article"
                          className={[
                            'dq-timetable-view__entry',
                            entry.isCompact ? 'dq-timetable-view__entry--compact' : '',
                          ].filter(Boolean).join(' ')}
                          style={{
                            '--dq-timetable-entry-top': `${entry.top}px`,
                            '--dq-timetable-entry-height': `${entry.height}px`,
                          }}
                          data-duration-minutes={entry.durationMinutes}
                          aria-label={getEntryMetaLabel(entry)}
                        >
                          <Box
                            className="dq-timetable-view__entry-content"
                            gap="0.125rem"
                          >
                            <span className="dq-timetable-view__entry-name" translate="no">
                              {entry.displayName}
                            </span>
                            {showStyleTags ? renderStyleBadges(styleTagsByEntryId.get(entry.id)) : null}
                            <span className="dq-timetable-view__entry-time">
                              {entry.displayTime}{' '}
                              <span className="dq-timetable-view__entry-duration">
                                ({entry.displayDuration})
                              </span>
                            </span>
                            {renderTribeStack(entry)}
                          </Box>

                          {canEditLineup ? (
                            <Button
                              className="dq-timetable-view__favorite"
                              variant="ghost"
                              icon={PencilSimpleIcon}
                              size="sm"
                              radius="rounded"
                              ariaLabel={`Edit ${entry.displayName}`}
                              onClick={() => onEditEntry?.(entry.id)}
                            />
                          ) : canToggleFavorites ? (
                            <ToggleButton
                              className="dq-timetable-view__favorite"
                              variant="likes"
                              icon={HeartIcon}
                              size="sm"
                              radius="rounded"
                              pressed={isFavorite}
                              fillOnPress
                              ariaLabel={isFavorite ? 'Remove favorite' : 'Add favorite'}
                              onPressedChange={() => toggleFavorite?.(entry.id)}
                            />
                          ) : isFavorite ? (
                            <span className="dq-timetable-view__favorite dq-timetable-view__favorite--readonly" aria-label="Liked">
                              <HeartIcon weight="fill" />
                            </span>
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
                </Box>
              </>
            ) : null}
          </Box>
        )}
      </Box>

      <Drawer
        open={Boolean(selectedTribeEntry)}
        onClose={() => setSelectedTribeEntry(null)}
        title={selectedTribeEntry ? getEntryDisplayName(selectedTribeEntry.entry) : 'Tribe likes'}
        titleTranslate={selectedTribeEntry ? 'no' : undefined}
        subtitle={selectedTribeEntry ? getEntryMetaLabel(selectedTribeEntry.entry) : ''}
        subtitleTranslate={selectedTribeEntry ? 'no' : undefined}
      >
        <Box gap="var(--dq-ui-space-md)">
          {selectedTribeEntry?.likes.map((member) => {
            const fullName = getMemberDisplayName(member);

            return (
              <PeopleCard
                key={member.userId}
                avatarSrc={member.avatarUrl}
                avatarAlt={fullName}
                name={fullName}
                handle={member.username ? `@${member.username}` : 'Profile unavailable'}
              />
            );
          })}
        </Box>
      </Drawer>
    </Box>
  );
};

export default TimetableView;
