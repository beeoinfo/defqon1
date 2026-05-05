import { useMemo, useState } from 'react';
import { ArrowRightIcon, HeartBreakIcon, HeartIcon, LightningIcon } from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import Box from '@/components/layout/Box';
import Drawer from '@/components/layout/Drawer';
import SlidingColumns from '@/components/layout/SlidingColumns';
import PeopleCard from '@/components/PeopleCard';
import PeopleStack from '@/components/PeopleStack';
import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import ToggleButton from '@/components/primitives/ToggleButton';
import {
  REVIEW_SECTION_MESSAGE,
  getDayLabel,
  getEntryDayLabel,
  getEntryDisplayName,
  getEntryMetaLabel,
} from '@/lib/lineup';
import { getStageTheme } from '@/lib/stageThemes';
import '../TimetableView/TimetableView.css';
import './ReviewsView.css';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const MAX_VISIBLE_TRIBE_AVATARS = 6;
const CONFLICT_OVERLAP_THRESHOLD = 0.25;

const formatTimeRange = (startAt, endAt) => {
  const startDate = startAt ? new Date(startAt) : null;
  const endDate = endAt ? new Date(endAt) : null;
  const hasStart = startDate && !Number.isNaN(startDate.getTime());
  const hasEnd = endDate && !Number.isNaN(endDate.getTime());

  if (hasStart && hasEnd) {
    return `${TIME_FORMATTER.format(startDate)} - ${TIME_FORMATTER.format(endDate)}`;
  }

  if (hasStart) {
    return TIME_FORMATTER.format(startDate);
  }

  if (hasEnd) {
    return TIME_FORMATTER.format(endDate);
  }

  return null;
};

const getSavedIdParts = (id) => {
  const parts = String(id ?? '').split('_').filter(Boolean);

  return {
    daySlug: parts[0] ?? null,
    stageSlug: parts[1] ?? null,
  };
};

const getStageLabelFromSlug = (stageSlug) => {
  if (!stageSlug) {
    return null;
  }

  if (stageSlug === 'uv' || stageSlug === 'u-v') {
    return 'U.V.';
  }

  return stageSlug
    .split('-')
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join(' ');
};

const getMemberDisplayName = (member) => (
  [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || 'Tribe member'
);

const getReviewFavoriteDayLabel = (favorite) => {
  if (favorite.daySlug) {
    return getDayLabel(favorite.daySlug);
  }

  const favoriteIdParts = getSavedIdParts(favorite.id);
  return favoriteIdParts.daySlug ? getDayLabel(favoriteIdParts.daySlug) : 'Unknown day';
};

const getTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const compareReviewItems = (leftItem, rightItem) => (
  (leftItem.dayOrder ?? 999) - (rightItem.dayOrder ?? 999) ||
  String(leftItem.startAt ?? '').localeCompare(String(rightItem.startAt ?? '')) ||
  String(leftItem.stage ?? '').localeCompare(String(rightItem.stage ?? '')) ||
  getEntryDisplayName(leftItem).localeCompare(getEntryDisplayName(rightItem))
);

const entriesOverlap = (leftEntry, rightEntry) => {
  const leftStart = getTimestamp(leftEntry.startAt);
  const leftEnd = getTimestamp(leftEntry.endAt);
  const rightStart = getTimestamp(rightEntry.startAt);
  const rightEnd = getTimestamp(rightEntry.endAt);

  if (
    leftStart === null ||
    leftEnd === null ||
    rightStart === null ||
    rightEnd === null
  ) {
    return false;
  }

  return leftStart < rightEnd && rightStart < leftEnd;
};

const entriesHaveMeaningfulConflict = (leftEntry, rightEntry, ignoreSmallConflicts) => {
  const leftStart = getTimestamp(leftEntry.startAt);
  const leftEnd = getTimestamp(leftEntry.endAt);
  const rightStart = getTimestamp(rightEntry.startAt);
  const rightEnd = getTimestamp(rightEntry.endAt);

  if (
    leftStart === null ||
    leftEnd === null ||
    rightStart === null ||
    rightEnd === null ||
    leftEnd <= leftStart ||
    rightEnd <= rightStart
  ) {
    return false;
  }

  const overlapDuration = Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart);

  if (overlapDuration <= 0) {
    return false;
  }

  if (!ignoreSmallConflicts) {
    return true;
  }

  const largestDuration = Math.max(leftEnd - leftStart, rightEnd - rightStart);

  return largestDuration > 0 && overlapDuration > largestDuration * CONFLICT_OVERLAP_THRESHOLD;
};

const getConflictKey = (leftId, rightId) => (
  [leftId, rightId].sort().join('__')
);

const getMaximalConflictCliques = (entries, ignoreSmallConflicts) => {
  const conflictKeys = new Set();

  entries.forEach((entry, entryIndex) => {
    entries.slice(entryIndex + 1).forEach((candidateEntry) => {
      if (entriesHaveMeaningfulConflict(entry, candidateEntry, ignoreSmallConflicts)) {
        conflictKeys.add(getConflictKey(entry.id, candidateEntry.id));
      }
    });
  });

  const cliques = [];

  const expandClique = (clique, candidates) => {
    if (candidates.length === 0) {
      if (clique.length > 1) {
        cliques.push(clique);
      }

      return;
    }

    candidates.forEach((candidateEntry, candidateIndex) => {
      const nextClique = [...clique, candidateEntry];
      const nextCandidates = candidates
        .slice(candidateIndex + 1)
        .filter((nextCandidateEntry) => (
          nextClique.every((cliqueEntry) => (
            conflictKeys.has(getConflictKey(cliqueEntry.id, nextCandidateEntry.id))
          ))
        ));

      expandClique(nextClique, nextCandidates);
    });
  };

  expandClique([], entries);

  return cliques.filter((clique) => (
    !cliques.some((candidateClique) => (
      candidateClique.length > clique.length &&
      clique.every((entry) => candidateClique.some((candidateEntry) => candidateEntry.id === entry.id))
    ))
  ));
};

const getConflictGroupRange = (entries) => {
  const timestamps = entries.reduce((result, entry) => {
    const start = getTimestamp(entry.startAt);
    const end = getTimestamp(entry.endAt);

    return {
      start: start === null ? result.start : Math.min(result.start, start),
      end: end === null ? result.end : Math.max(result.end, end),
    };
  }, { start: Number.POSITIVE_INFINITY, end: Number.NEGATIVE_INFINITY });

  if (!Number.isFinite(timestamps.start) || !Number.isFinite(timestamps.end)) {
    return null;
  }

  return {
    start: timestamps.start,
    end: timestamps.end,
    label: `${TIME_FORMATTER.format(new Date(timestamps.start))} - ${TIME_FORMATTER.format(new Date(timestamps.end))}`,
  };
};

const getConflictGroupLayout = (entries, range) => {
  const layoutEntries = entries.map((entry) => {
    const start = getTimestamp(entry.startAt);
    const end = getTimestamp(entry.endAt);
    const rangeDuration = range && range.end > range.start ? range.end - range.start : 0;
    const left = start !== null && rangeDuration > 0
      ? ((start - range.start) / rangeDuration) * 100
      : 0;
    const width = start !== null && end !== null && end > start && rangeDuration > 0
      ? ((end - start) / rangeDuration) * 100
      : 100;

    return {
      ...entry,
      conflictStart: start,
      conflictEnd: end,
      conflictLeft: Math.max(0, Math.min(left, 100)),
      conflictWidth: Math.max(8, Math.min(width, 100)),
    };
  });

  return {
    entries: layoutEntries,
  };
};

const getConflictSections = (entries, ignoreSmallConflicts) => {
  const entriesByDay = entries.slice().sort(compareReviewItems).reduce((groups, entry) => {
    const dayLabel = getEntryDayLabel(entry);
    const dayEntries = groups.get(dayLabel) ?? [];

    dayEntries.push(entry);
    groups.set(dayLabel, dayEntries);

    return groups;
  }, new Map());

  return Array.from(entriesByDay.entries()).map(([dayLabel, dayEntries]) => {
    const groups = [];
    const conflictCliques = getMaximalConflictCliques(dayEntries, ignoreSmallConflicts);

    conflictCliques.forEach((clique) => {
      const sortedGroupEntries = clique.slice().sort(compareReviewItems);
      const range = getConflictGroupRange(sortedGroupEntries);
      const layout = getConflictGroupLayout(sortedGroupEntries, range);
      const groupColor = sortedGroupEntries.find((groupEntry) => groupEntry.stageColor)?.stageColor ??
        getStageTheme(sortedGroupEntries[0]?.stage).accent;

      groups.push({
        id: sortedGroupEntries.map((groupEntry) => groupEntry.id).join('__'),
        entries: layout.entries,
        color: groupColor,
        range,
      });
    });

    return {
      id: dayLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: dayLabel,
      groups,
    };
  }).filter((section) => section.groups.length > 0);
};

const ReviewsView = ({
  hasLineup = true,
  reviewFavorites = [],
  conflictEntries = [],
  favoriteIdSet = new Set(),
  toggleFavorite,
  removeReviewFavorite,
  onOpenTimetableConflicts,
  tribeLikesByEntryId = new Map(),
  ignoreSmallConflicts = false,
  canManageFavorites = true,
  archiveNotice = null,
  isAuthenticated = true,
}) => {
  const [activeTab, setActiveTab] = useState('lineup-updates');
  const [selectedTribeEntry, setSelectedTribeEntry] = useState(null);
  const reviewSections = useMemo(() => {
    const favoritesByDay = reviewFavorites.slice().sort(compareReviewItems).reduce((groups, favorite) => {
      const dayLabel = getReviewFavoriteDayLabel(favorite);
      const dayFavorites = groups.get(dayLabel) ?? [];

      dayFavorites.push(favorite);
      groups.set(dayLabel, dayFavorites);

      return groups;
    }, new Map());

    return Array.from(favoritesByDay.entries()).map(([dayLabel, favorites]) => ({
      id: dayLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: dayLabel,
      favorites,
    }));
  }, [reviewFavorites]);
  const conflictSections = useMemo(
    () => getConflictSections(conflictEntries, ignoreSmallConflicts),
    [conflictEntries, ignoreSmallConflicts]
  );
  const reviewFilterBar = useMemo(() => ({
    width: 'content',
    resetButton: false,
    ariaLabel: 'Review type',
    value: {
      reviewType: activeTab,
    },
    onChange: (nextValue) => {
      setActiveTab(nextValue.reviewType ?? 'lineup-updates');
    },
    choices: [
      {
        id: 'lineup-updates',
        name: 'reviewType',
        type: 'radio',
        value: 'lineup-updates',
        label: 'Updates',
        icon: HeartBreakIcon,
        tag: reviewFavorites.length,
        tagVariant: 'count',
        className: 'dq-ui-choice-button--floating-tag',
      },
      {
        id: 'timetable-conflicts',
        name: 'reviewType',
        type: 'radio',
        value: 'timetable-conflicts',
        label: 'Conflicts',
        icon: LightningIcon,
        tag: conflictEntries.length,
        tagVariant: 'count',
        className: 'dq-ui-choice-button--floating-tag',
      },
    ],
  }), [activeTab, conflictEntries.length, reviewFavorites.length]);

  if (!isAuthenticated) {
    return (
      <Alert variant="neutral" title="Sign in to review saved favorites">
        Reviews become useful once your favorites are synced to your account.
      </Alert>
    );
  }

  if (archiveNotice) {
    return (
      <Alert variant="warning" title="Archived line-up snapshot">
        {archiveNotice}
      </Alert>
    );
  }

  if (!hasLineup) {
    return (
      <EmptyState text="No lineup has been loaded yet." />
    );
  }

  const hasActiveLineupUpdates = activeTab === 'lineup-updates';
  const hasActiveTimetableConflicts = activeTab === 'timetable-conflicts';
  const shouldShowReviewNotice = hasActiveLineupUpdates && reviewFavorites.length > 0;
  const shouldShowConflictNotice = hasActiveTimetableConflicts && conflictEntries.length > 0;
  const shouldShowLineupEmpty = hasActiveLineupUpdates && reviewFavorites.length === 0;
  const shouldShowConflictEmpty = hasActiveTimetableConflicts && conflictEntries.length === 0;
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
        className="dq-reviews-view__people-stack"
        ariaLabel={`Open tribe details for ${tribeLikesFromOthers.length} member${tribeLikesFromOthers.length === 1 ? '' : 's'}`}
        onClick={() => setSelectedTribeEntry({ entry, likes: tribeLikesFromOthers })}
      />
    );
  };
  const renderReviewFavoriteCard = (favorite) => {
    const favoriteIdParts = getSavedIdParts(favorite.id);
    const favoriteStage = getStageLabelFromSlug(favoriteIdParts.stageSlug);
    const favoriteDay = getReviewFavoriteDayLabel(favorite);
    const favoriteTime = favorite.timeLabel ?? formatTimeRange(favorite.startAt, favorite.endAt);
    const favoriteTheme = getStageTheme(favoriteStage);
    const favoriteColor = favorite.stageColor ?? favoriteTheme.accent;
    const hasSuggestions = favorite.suggestions?.length > 0;

    return (
      <Card
        key={favorite.favoriteKey}
        color={favoriteColor}
        title={getEntryDisplayName(favorite)}
        meta1={favoriteStage}
        meta2={favoriteDay}
        meta3={favoriteTime}
        metaVariant="strikethrough"
        actionVariant={canManageFavorites ? 'close' : null}
        actionAriaLabel="Dismiss review"
        onAction={() => removeReviewFavorite?.(favorite.favoriteKey)}
        description={hasSuggestions ? 'You may be looking for this instead' : 'Uh oh... It seems your artist disappeared :('}
      >
        {favorite.suggestions?.length ? (
          <Box gap="var(--dq-ui-space-sm)">
            <Box gap="var(--dq-ui-space-sm)">
              {favorite.suggestions.map((suggestion) => {
                const suggestionTheme = getStageTheme(suggestion.stage);
                const suggestionColor = suggestion.stageColor ?? suggestionTheme.accent;
                const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);

                return (
                  <Card
                    key={suggestion.id}
                    component="div"
                    color={suggestionColor}
                    title={getEntryDisplayName(suggestion)}
                    meta1={suggestion.stage}
                    meta2={getEntryDayLabel(suggestion)}
                    meta3={suggestion.timeLabel}
                    actionVariant={canManageFavorites ? 'likes' : null}
                    actionPressed={isSuggestionFavorite}
                    actionAriaLabel={
                      isSuggestionFavorite ? 'Remove favorite' : 'Add favorite'
                    }
                    onAction={() => toggleFavorite?.(suggestion.id)}
                  />
                );
              })}
            </Box>
          </Box>
        ) : undefined}
      </Card>
    );
  };

  return (
    <Box gap="var(--dq-ui-space-xl)">
      <FilterBar {...reviewFilterBar} />

      {shouldShowReviewNotice ? (
        <Alert variant="warning" title="A few saved favorites need a quick review">
          {REVIEW_SECTION_MESSAGE}
        </Alert>
      ) : null}

      {shouldShowConflictNotice ? (
        <Alert variant="warning" title="Some saved sets overlap in the timetable">
          Review the linked conflict groups below, then open the filtered timetable for the matching day.
        </Alert>
      ) : null}

      {shouldShowLineupEmpty ? (
        <EmptyState text="No favorite line-up updates require a review right now." />
      ) : null}

      {shouldShowConflictEmpty ? (
        <EmptyState text="No favorite timetable conflicts require a review right now." />
      ) : null}

      {hasActiveLineupUpdates && reviewFavorites.length > 0 ? (
        <SlidingColumns
          variant="stacked"
          sections={reviewSections.map((section) => ({
            id: section.id,
            label: section.label,
            content: (
              <Box
                layout="columns"
                maxColumns={4}
                gap="var(--dq-ui-space-lg)"
                className="dq-reviews-view__columns"
              >
                {section.favorites.map(renderReviewFavoriteCard)}
              </Box>
            ),
          }))}
        />
      ) : null}

      {hasActiveTimetableConflicts && conflictEntries.length > 0 ? (
        <SlidingColumns
          variant="stacked"
          sections={conflictSections.map((section) => ({
            id: section.id,
            label: section.label,
            content: (
              <Box
                className="dq-reviews-view__conflict-groups"
                gap="var(--dq-ui-space-md)"
              >
                {section.groups.map((group) => (
                  <Box
                    key={group.id}
                    component="article"
                    background="surface"
                    className="dq-reviews-view__conflict-group"
                  >
                    <Box
                      slot="content"
                      className="dq-reviews-view__conflict-group-head"
                    >
                      <strong>
                        {group.entries.length} show{group.entries.length === 1 ? '' : 's'}
                      </strong>
                    </Box>

                    {group.range ? (
                      <Box
                        className="dq-reviews-view__conflict-time-start"
                        direction="row"
                        justify="flex-start"
                        align="center"
                      >
                        <time dateTime={new Date(group.range.start).toISOString()}>
                          {TIME_FORMATTER.format(new Date(group.range.start))}
                        </time>
                      </Box>
                    ) : null}

                    <Box
                      className="dq-reviews-view__conflict-timeline"
                      gap="0"
                    >
                      {group.entries.map((entry) => {
                        const stageTheme = getStageTheme(entry.stage);
                        const entryColor = entry.stageColor ?? stageTheme.accent;

                        return (
                          <Box
                            key={entry.id}
                            className="dq-reviews-view__conflict-show"
                            style={{
                              '--dq-reviews-conflict-color': entryColor,
                              '--dq-reviews-conflict-left': `${entry.conflictLeft}%`,
                              '--dq-reviews-conflict-width': `${entry.conflictWidth}%`,
                            }}
                            gap="3px"
                          >
                            <Box
                              className="dq-timetable-view__entry-content"
                              gap="0.125rem"
                            >
                              <span className="dq-timetable-view__entry-name">
                                {getEntryDisplayName(entry)}
                              </span>
                              <span className="dq-timetable-view__entry-time">
                                <span>{getEntryDayLabel(entry)}</span>
                                <span>{entry.stage}</span>
                                <span>{entry.timeLabel ?? formatTimeRange(entry.startAt, entry.endAt)}</span>
                              </span>
                              {renderTribeStack(entry)}
                            </Box>

                            {canManageFavorites ? (
                              <ToggleButton
                                className="dq-timetable-view__favorite"
                                variant="likes"
                                icon={HeartIcon}
                                size="sm"
                                radius="rounded"
                                pressed
                                fillOnPress
                                ariaLabel="Remove favorite"
                                onPressedChange={() => toggleFavorite?.(entry.id)}
                              />
                            ) : null}
                          </Box>
                        );
                      })}
                    </Box>

                    {group.range ? (
                      <Box
                        className="dq-reviews-view__conflict-time-end"
                        direction="row"
                        justify="flex-end"
                        align="center"
                      >
                        <time dateTime={new Date(group.range.end).toISOString()}>
                          {TIME_FORMATTER.format(new Date(group.range.end))}
                        </time>
                      </Box>
                    ) : null}

                    <Button
                      className="dq-reviews-view__show-conflict-button"
                      icon={ArrowRightIcon}
                      iconPosition="end"
                      radius="rounded"
                      variant="ghost"
                      onClick={() => onOpenTimetableConflicts?.(section.label)}
                    >
                      Show conflict
                    </Button>
                  </Box>
                ))}
              </Box>
            ),
          }))}
        />
      ) : null}

      <Drawer
        open={Boolean(selectedTribeEntry)}
        onClose={() => setSelectedTribeEntry(null)}
        title={selectedTribeEntry ? getEntryDisplayName(selectedTribeEntry.entry) : 'Tribe likes'}
        subtitle={selectedTribeEntry ? getEntryMetaLabel(selectedTribeEntry.entry) : ''}
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

export default ReviewsView;
