import { useMemo, useState } from 'react';
import Alert from '@/components/Alert';
import FilterBar from '@/components/FilterBar';
import PeopleCard from '@/components/PeopleCard';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Card from '@/components/primitives/Card';
import Drawer from '@/components/layout/Drawer';
import SlidingColumns from '@/components/layout/SlidingColumns';
import PeopleStack from '@/components/PeopleStack';
import { compareLineupEntries, getEntryDayLabel, getEntryDisplayName, getEntryMetaLabel } from '@/lib/lineup';
import { getCanonicalStageName, getStageTheme } from '@/lib/stageThemes';
import './LineUpView.css';

const MAX_VISIBLE_TRIBE_AVATARS = 6;
const STAGE_PRIORITY_ORDER = ['BLUE', 'BLACK', 'RED', 'U.V.', 'GREEN', 'YELLOW'];
const STAGE_PRIORITY_INDEX = new Map(
  STAGE_PRIORITY_ORDER.map((stageName, index) => [stageName, index])
);

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
  meta1: getEntryDayLabel(entry),
  meta2: entry.timeLabel,
});

const LineUpView = ({
  groupedEntries = {},
  entries = [],
  favoriteIdSet = new Set(),
  toggleFavorite,
  canToggleFavorites = true,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
  stackDays = false,
  filterBar = null,
}) => {
  const [selectedTribeEntry, setSelectedTribeEntry] = useState(null);

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
          color: '#bc9b5e',
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
                  titleCountLabel={stageSection.entries.length === 1 ? 'artist' : 'artists'}
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
                        ? (alternativeEntriesById.get(entry.id) ?? []).slice(0, 3)
                        : [];
                      const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
                      const tribeLikesFromOthers = tribeLikes.filter((member) => !member.isCurrentUser);

                      return (
                        <Card
                          key={entry.id}
                          color={entry.stageColor ?? stageColor}
                          title={getEntryDisplayName(entry)}
                          {...getEntryCardMetaProps(entry)}
                          actionVariant={canToggleFavorites ? 'likes' : null}
                          actionPressed={isFavorite}
                          actionAriaLabel={isFavorite ? 'Remove favorite' : 'Add favorite'}
                          onAction={() => toggleFavorite?.(entry.id)}
                        >
                          {showTribeOnly && tribeLikesFromOthers.length > 0 ? (
                            <Box gap="var(--dq-ui-space-sm)">
                              <p
                                style={{
                                  margin: 0,
                                  color: 'var(--dq-ui-text-soft)',
                                }}
                              >
                                {tribeLikesFromOthers.length} member
                                {tribeLikesFromOthers.length === 1 ? '' : 's'} from your tribe saved this set.
                              </p>
                              <PeopleStack
                                avatars={tribeLikesFromOthers}
                                maxVisible={MAX_VISIBLE_TRIBE_AVATARS}
                                onClick={() => setSelectedTribeEntry({ entry, likes: tribeLikesFromOthers })}
                              />
                            </Box>
                          ) : null}

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
                                      {...getEntryCardMetaProps(suggestion)}
                                      actionVariant={canToggleFavorites ? 'likes' : null}
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
      canToggleFavorites,
      daySections,
      favoriteIdSet,
      showTribeOnly,
      toggleFavorite,
      tribeLikesByEntryId,
    ]
  );

  return (
    <Box gap="0">
      {filterBar ? <FilterBar {...filterBar} /> : null}

      <Box gap="var(--dq-ui-space-xl)">
        {archiveNotice ? (
          <Alert variant="warning" title="Archived line-up snapshot">
            {archiveNotice}
          </Alert>
        ) : null}

        {sections.length === 0 ? (
          <EmptyState text="No artists match the current filters." />
        ) : (
          <SlidingColumns sections={sections} variant={stackDays ? 'stacked' : 'responsive'} />
        )}
      </Box>

      <Drawer
        open={Boolean(selectedTribeEntry)}
        onClose={() => setSelectedTribeEntry(null)}
        title={selectedTribeEntry ? getEntryDisplayName(selectedTribeEntry.entry) : 'Tribe likes'}
        subtitle={selectedTribeEntry ? getEntryMetaLabel(selectedTribeEntry.entry) : ''}
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
