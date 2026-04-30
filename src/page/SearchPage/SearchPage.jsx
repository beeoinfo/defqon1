import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import LineUpView from '@/views/LineUpView';
import { SearchInput } from '@/components/primitives/forms';
import './SearchPage.css';

export const SearchPageHeaderContent = ({
  query = '',
  onQueryChange = null,
}) => (
  <Box
    direction="row"
    align="center"
    gap="6px"
    className="dq-search-page__header-content"
  >
    <SearchPageHeaderSearch query={query} onQueryChange={onQueryChange} />
  </Box>
);

const SearchPageHeaderSearch = ({ query, onQueryChange }) => (
  <SearchInput
    className="dq-search-page__header-input"
    ariaLabel="Search"
    value={query}
    onChange={(event) => onQueryChange?.(event.target.value)}
    placeholder="Search artist, duo, show..."
    autoFocus
  />
);

const SearchPage = ({
  query = '',
  groupedEntries = {},
  entries = [],
  favoriteIdSet = new Set(),
  toggleFavorite,
  canToggleFavorites = true,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
}) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return (
      <Alert variant="neutral" title="Start typing to search the line-up">
        Search an artist, duo or show across every day and stage.
      </Alert>
    );
  }

  if (Object.keys(groupedEntries).length === 0) {
    return (
      <Alert variant="neutral" title="No results found">
        Try another spelling or broaden the search term.
      </Alert>
    );
  }

  return (
    <LineUpView
      groupedEntries={groupedEntries}
      entries={entries}
      favoriteIdSet={favoriteIdSet}
      toggleFavorite={toggleFavorite}
      canToggleFavorites={canToggleFavorites}
      tribeLikesByEntryId={tribeLikesByEntryId}
      archiveNotice={archiveNotice}
      stackDays
    />
  );
};

export default SearchPage;
