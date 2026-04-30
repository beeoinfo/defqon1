import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Card from '@/components/primitives/Card';
import Badge from '@/components/primitives/Badge';
import Title from '@/components/primitives/Title';
import { REVIEW_SECTION_MESSAGE, getEntryDisplayName, getEntryMetaLabel, getSavedFavoritePreviousLabel } from '@/lib/lineup';
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
      <Alert variant="neutral" title="Sign in to review saved favorites">
        Reviews become useful once your favorites are synced to your account.
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

      {archiveNotice ? (
        <Alert variant="warning" title="Archived line-up snapshot">
          {archiveNotice}
        </Alert>
      ) : (
        <Alert variant="warning" title="A few saved favorites need a quick review">
          {REVIEW_SECTION_MESSAGE}
        </Alert>
      )}

      <Box
        layout="columns"
        maxColumns={4}
        gap="var(--dq-ui-space-lg)"
        className="dq-reviews-view__columns"
      >
        {reviewFavorites.map((favorite) => {
          const favoriteTheme = getStageTheme(favorite.stage);
          const hasSuggestions = !archiveNotice && (favorite.suggestions?.length > 0);

          return (
            <Card
              key={favorite.favoriteKey}
              color={favoriteTheme.accent}
              title={favorite.artistRaw}
              meta1={getSavedFavoritePreviousLabel(favorite)}
              metaVariant="strikethrough"
              actionVariant={canManageFavorites ? 'close' : null}
              actionAriaLabel="Dismiss review"
              onAction={() => removeReviewFavorite?.(favorite.favoriteKey)}
              description={hasSuggestions ? 'You may be looking for this instead' : 'Uh oh... It seems your artist disappeared :('}
            >
              {archiveNotice ? null : favorite.suggestions?.length ? (
                <Box gap="var(--dq-ui-space-sm)">
                  <Box gap="var(--dq-ui-space-sm)">
                    {favorite.suggestions.map((suggestion) => {
                      const suggestionTheme = getStageTheme(suggestion.stage);
                      const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);

                      return (
                        <Card
                          key={suggestion.id}
                          component="div"
                          color={suggestionTheme.accent}
                          title={getEntryDisplayName(suggestion)}
                          meta1={getEntryMetaLabel(suggestion)}
                          actionVariant={canManageFavorites ? 'favorite' : null}
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
