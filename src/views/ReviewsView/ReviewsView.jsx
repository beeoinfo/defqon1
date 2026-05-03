import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Card from '@/components/primitives/Card';
import Badge from '@/components/primitives/Badge';
import Title from '@/components/primitives/Title';
import { REVIEW_SECTION_MESSAGE, getEntryDayLabel, getEntryDisplayName } from '@/lib/lineup';
import { getStageTheme } from '@/lib/stageThemes';
import './ReviewsView.css';

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
      <Alert variant="neutral" title="Sign in to review saved likes">
        Reviews become useful once your likes are synced to your account.
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
    return <EmptyState text="No likes require a review right now." />;
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

      <Alert variant="warning" title="A few saved likes need a quick review">
        {REVIEW_SECTION_MESSAGE}
      </Alert>

      <Box
        layout="columns"
        maxColumns={4}
        gap="var(--dq-ui-space-lg)"
        className="dq-reviews-view__columns"
      >
        {reviewFavorites.map((favorite) => {
          const favoriteTheme = getStageTheme(favorite.stage);
          const favoriteColor = favorite.stageColor ?? favoriteTheme.accent;
          const hasSuggestions = favorite.suggestions?.length > 0;

          return (
            <Card
              key={favorite.favoriteKey}
              color={favoriteColor}
              title={getEntryDisplayName(favorite)}
              meta1={favorite.stage}
              meta2={getEntryDayLabel(favorite)}
              meta3={favorite.timeLabel}
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
                            isSuggestionFavorite ? 'Remove like' : 'Add like'
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
