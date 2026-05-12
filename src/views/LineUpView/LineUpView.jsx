import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartIcon } from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import FilterBar from '@/components/FilterBar';
import PeopleCard from '@/components/PeopleCard';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Card from '@/components/primitives/Card';
import ToggleButton from '@/components/primitives/ToggleButton';
import Drawer from '@/components/layout/Drawer';
import SlidingColumns from '@/components/layout/SlidingColumns';
import PeopleStack from '@/components/PeopleStack';
import Badge from '@/components/primitives/Badge';
import {
  compareLineupEntries,
  getEntryDayLabel,
  getEntryDisplayName,
  getEntryMetaLabel,
  getEntryTimeLabel,
} from '@/lib/lineup';
import { getCanonicalStageName, getStageTheme } from '@/lib/stageThemes';
import './LineUpView.css';

const MAX_VISIBLE_TRIBE_AVATARS = 6;
const STYLE_TAG_BADGE_BACKGROUND = 'rgba(56, 189, 248, 0.12)';
const STYLE_TAG_BADGE_BORDER = 'rgba(56, 189, 248, 0.36)';
const STYLE_TAG_BADGE_TEXT = '#7dd3fc';
const ADDITIONAL_STYLE_TAG_BADGE_BACKGROUND = 'rgba(251, 191, 36, 0.13)';
const ADDITIONAL_STYLE_TAG_BADGE_BORDER = 'rgba(251, 191, 36, 0.4)';
const ADDITIONAL_STYLE_TAG_BADGE_TEXT = '#fcd34d';
const STAGE_PRIORITY_ORDER = ['BLUE', 'BLACK', 'RED', 'U.V.', 'GREEN', 'YELLOW'];
const STAGE_PRIORITY_INDEX = new Map(
  STAGE_PRIORITY_ORDER.map((stageName, index) => [stageName, index])
);
const JOKE_IMAGE_MODULES = import.meta.glob('../../assets/joke/*.{avif,gif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
});
const JOKE_IMAGE_URLS = Object.entries(JOKE_IMAGE_MODULES)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath, undefined, { numeric: true }))
  .map(([, imageUrl]) => imageUrl);

const compareStages = (leftStage, rightStage) => {
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
};

const compareStageSections = (leftStage, rightStage) => {
  const leftStageOrder = leftStage.entries[0]?.stageOrder;
  const rightStageOrder = rightStage.entries[0]?.stageOrder;

  if (leftStageOrder !== undefined || rightStageOrder !== undefined) {
    return (
      (leftStageOrder ?? 999) - (rightStageOrder ?? 999) ||
      compareStages(leftStage.stage, rightStage.stage)
    );
  }

  return compareStages(leftStage.stage, rightStage.stage);
};

const getEntryCardMetaProps = (entry) => ({
  meta1: entry.stage,
  meta2: getEntryDayLabel(entry),
  meta3: getEntryTimeLabel(entry),
});

const renderStyleBadges = (styleTags) => {
  if (!styleTags?.length) {
    return null;
  }

  return (
    <Box
      className="dq-lineup-view__style-tags"
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

const LineUpView = ({
  hasLineup = true,
  groupedEntries = {},
  entries = [],
  favoriteIdSet = new Set(),
  toggleFavorite,
  canToggleFavorites = true,
  canEditLineup = false,
  onEditEntry = null,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
  archiveNoticeTitle = 'Archived line-up snapshot',
  stackDays = false,
  filterBar = null,
  showStyleTags = false,
  styleTagsByEntryId = new Map(),
  shouldShowJokeLineup = false,
  jokeLineupSearchKey = '',
}) => {
  const [selectedTribeEntry, setSelectedTribeEntry] = useState(null);
  const [isJokeLiked, setIsJokeLiked] = useState(false);
  const jokeImageUrl = useMemo(() => {
    if (!shouldShowJokeLineup || JOKE_IMAGE_URLS.length === 0) {
      return '';
    }

    const randomIndex = Math.floor(Math.random() * JOKE_IMAGE_URLS.length);
    return JOKE_IMAGE_URLS[randomIndex];
  }, [jokeLineupSearchKey, shouldShowJokeLineup]);
  const getFavoriteActionVariant = useCallback((isFavorite) => (
    canEditLineup ? 'edit' : canToggleFavorites ? 'likes' : isFavorite ? 'liked' : null
  ), [canEditLineup, canToggleFavorites]);
  const getActionAriaLabel = useCallback((entry, isFavorite) => (
    canEditLineup
      ? `Edit ${getEntryDisplayName(entry)}`
      : isFavorite ? 'Remove favorite' : 'Add favorite'
  ), [canEditLineup]);
  const handleEntryAction = useCallback((entry) => {
    if (canEditLineup) {
      onEditEntry?.(entry.id);
      return;
    }

    toggleFavorite?.(entry.id);
  }, [canEditLineup, onEditEntry, toggleFavorite]);

  const alternativeEntriesById = useMemo(() => {
    if (showTribeOnly) {
      return new Map();
    }

    const entriesByToken = new Map();

    entries.forEach((entry) => {
      entry.artistTokens.forEach((token) => {
        if (!token) {
          return;
        }

        const tokenEntries = entriesByToken.get(token) ?? [];
        tokenEntries.push(entry);
        entriesByToken.set(token, tokenEntries);
      });
    });

    return entries.reduce((alternativesByEntryId, entry) => {
      const seenIds = new Set();
      const alternatives = [];

      entry.artistTokens.forEach((token) => {
        const tokenEntries = entriesByToken.get(token) ?? [];

        tokenEntries.forEach((candidate) => {
          if (candidate.id === entry.id || seenIds.has(candidate.id)) {
            return;
          }

          seenIds.add(candidate.id);
          alternatives.push(candidate);
        });
      });

      alternatives.sort(
        (leftEntry, rightEntry) => compareLineupEntries(leftEntry, rightEntry)
      );

      alternativesByEntryId.set(entry.id, alternatives);
      return alternativesByEntryId;
    }, new Map());
  }, [entries, showTribeOnly]);

  const daySections = useMemo(
    () =>
      Object.entries(groupedEntries)
        .map(([day, dayStages]) => ({
          id: day.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          label: day,
          day,
          stages: Object.entries(dayStages)
            .map(([stage, stageEntries]) => ({
              id: `${day}-${stage}`,
              stage,
              entries: stageEntries,
              color: stageEntries.find((entry) => entry.stageColor)?.stageColor ?? null,
            }))
            .sort(compareStageSections),
        }))
        .filter((section) => section.stages.length > 0),
    [groupedEntries]
  );

  const sections = useMemo(
    () =>
      daySections.map((section) => ({
        id: section.id,
        label: section.label,
        color: section.color,
        content: (
          <Box className="dq-lineup-view__stage-sections">
            {section.stages.map((stageSection) => {
              const stageTheme = getStageTheme(stageSection.stage);
              const stageColor = stageSection.color ?? stageTheme.accent;

              return (
                <Box
                  key={stageSection.id}
                  component="section"
                  background="surface"
                  color={stageColor}
                  titleBadge={stageSection.stage}
                  titleCount={stageSection.entries.length}
                  titleCountLabel={stageSection.entries.length === 1 ? 'show' : 'shows'}
                  className="dq-lineup-view__stage-section"
                >
                  <Box
                    layout="columns"
                    maxColumns={4}
                    gap="var(--dq-ui-space-md)"
                    className="dq-lineup-view__artist-columns"
                  >
                    {stageSection.entries.map((entry) => {
                      const isFavorite = favoriteIdSet.has(entry.id);
                      const relatedSuggestions = isFavorite
                        ? (alternativeEntriesById.get(entry.id) ?? [])
                          .filter((suggestion) => !favoriteIdSet.has(suggestion.id))
                          .slice(0, 3)
                        : [];
                      const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
                      const tribeLikesFromOthers = tribeLikes.filter((member) => !member.isCurrentUser);

                      return (
                        <Card
                          key={entry.id}
                          color={entry.stageColor ?? stageColor}
                          title={getEntryDisplayName(entry)}
                          underTitle={showStyleTags ? renderStyleBadges(styleTagsByEntryId.get(entry.id)) : null}
                          {...getEntryCardMetaProps(entry)}
                          underMeta={
                            tribeLikesFromOthers.length > 0 ? (
                              <PeopleStack
                                avatars={tribeLikesFromOthers}
                                maxVisible={MAX_VISIBLE_TRIBE_AVATARS}
                                onClick={() => setSelectedTribeEntry({ entry, likes: tribeLikesFromOthers })}
                              />
                            ) : null
                          }
                          actionVariant={getFavoriteActionVariant(isFavorite)}
                          actionPressed={isFavorite}
                          actionAriaLabel={getActionAriaLabel(entry, isFavorite)}
                          onAction={() => handleEntryAction(entry)}
                        >
                          {showTribeOnly && tribeLikes.length > 0 && tribeLikesFromOthers.length === 0 ? (
                            <p className="dq-lineup-view__tribe-note">
                              Only you saved this set in your tribe.
                            </p>
                          ) : null}

                          {!showTribeOnly && relatedSuggestions.length > 0 ? (
                            <Box gap="var(--dq-ui-space-sm)">
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--dq-ui-text-soft)',
                                }}
                              >
                                This artist also appears elsewhere in the lineup.
                              </p>
                              <Box gap="var(--dq-ui-space-sm)">
                                {relatedSuggestions.map((suggestion) => {
                                  const suggestionTheme = getStageTheme(suggestion.stage);
                                  const suggestionColor = suggestion.stageColor ?? suggestionTheme.accent;
                                  const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);

                                  return (
                                    <Card
                                      key={suggestion.id}
                                      component="div"
                                      color={suggestionColor}
                                      title={getEntryDisplayName(suggestion)}
                                      underTitle={showStyleTags ? renderStyleBadges(styleTagsByEntryId.get(suggestion.id)) : null}
                                      {...getEntryCardMetaProps(suggestion)}
                                      actionVariant={getFavoriteActionVariant(isSuggestionFavorite)}
                                      actionPressed={isSuggestionFavorite}
                                      actionAriaLabel={getActionAriaLabel(suggestion, isSuggestionFavorite)}
                                      onAction={() => handleEntryAction(suggestion)}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          ) : null}
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ),
      })),
    [
      alternativeEntriesById,
      daySections,
      favoriteIdSet,
      getActionAriaLabel,
      getFavoriteActionVariant,
      handleEntryAction,
      showTribeOnly,
      showStyleTags,
      styleTagsByEntryId,
      tribeLikesByEntryId,
    ]
  );

  useEffect(() => {
    setIsJokeLiked(false);
  }, [jokeImageUrl]);

  return (
    <Box gap="0">
      {filterBar ? <FilterBar {...filterBar} /> : null}

      <Box gap="var(--dq-ui-space-xl)">
        {archiveNotice ? (
          <Alert variant="warning" title={archiveNoticeTitle}>
            {archiveNotice}
          </Alert>
        ) : null}

        {shouldShowJokeLineup ? (
          <Box className="dq-lineup-view__joke-shell">
            <Box component="article" className="dq-lineup-view__joke-card">
              {jokeImageUrl ? (
                <img
                  key={jokeImageUrl}
                  className="dq-lineup-view__joke-image"
                  src={jokeImageUrl}
                  alt="Joke lineup"
                />
              ) : null}
              <Box className="dq-lineup-view__joke-action" component="span">
                <ToggleButton
                  variant="likes"
                  icon={HeartIcon}
                  pressed={isJokeLiked}
                  fillOnPress
                  ariaLabel={isJokeLiked ? 'Unlike joke lineup' : 'Like joke lineup'}
                  onPressedChange={setIsJokeLiked}
                />
              </Box>
            </Box>
          </Box>
        ) : sections.length === 0 ? (
          <EmptyState
            text={hasLineup ? 'No shows match the current filters.' : 'No lineup has been loaded yet.'}
          />
        ) : (
          <SlidingColumns sections={sections} variant={stackDays ? 'stacked' : 'responsive'} />
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
            const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || 'Tribe member';

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

export default LineUpView;
