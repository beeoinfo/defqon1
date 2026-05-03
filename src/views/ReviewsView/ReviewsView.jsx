import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Card from '@/components/primitives/Card';
import Badge from '@/components/primitives/Badge';
import Title from '@/components/primitives/Title';
import { REVIEW_SECTION_MESSAGE, getDayLabel, getEntryDayLabel, getEntryDisplayName } from '@/lib/lineup';
import { getStageTheme } from '@/lib/stageThemes';
import './ReviewsView.css';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

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

const getReviewReferenceEntry = (favorite) => favorite.suggestions?.[0] ?? null;

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

const ReviewsView = ({
  reviewFavorites = [],
  favoriteIdSet = new Set(),
  toggleFavorite,
  removeReviewFavorite,
  canManageFavorites = true,
  archiveNotice = null,
  isAuthenticated = true,
}) => {
  if (!isAuthenticated) {
    return (
      <Alert variant="neutral" title="Sign in to review saved favorites">
        Reviews become useful once your favorites are synced to your account.
      </Alert>
    );
  }

  if (archiveNotice) {
    return (
      <Alert variant="warning" title="Snapshot">
        {archiveNotice}
      </Alert>
    );
  }

  if (!reviewFavorites.length) {
    return <EmptyState text="No favorites require a review right now." />;
  }

  return (
    <Box gap="var(--dq-ui-space-xl)">
      <Box
        component="header"
        slot="content"
        direction="row"
        align="center"
        gap="var(--dq-ui-space-sm)"
        className="dq-reviews-view__header"
      >
        <Title component="h2" variant="h4" className="dq-reviews-view__title">
          Needs review
        </Title>
        <Badge variant="title" className="dq-reviews-view__count">
          {reviewFavorites.length}
        </Badge>
      </Box>

      <Alert variant="warning" title="A few saved favorites need a quick review">
        {REVIEW_SECTION_MESSAGE}
      </Alert>

      <Box
        layout="columns"
        maxColumns={4}
        gap="var(--dq-ui-space-lg)"
        className="dq-reviews-view__columns"
      >
        {reviewFavorites.map((favorite) => {
          const referenceEntry = getReviewReferenceEntry(favorite);
          const favoriteIdParts = getSavedIdParts(favorite.id);
          const favoriteStage = getStageLabelFromSlug(favoriteIdParts.stageSlug);
          const favoriteDay = favoriteIdParts.daySlug ? getDayLabel(favoriteIdParts.daySlug) : null;
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
        })}
      </Box>
    </Box>
  );
};

export default ReviewsView;
