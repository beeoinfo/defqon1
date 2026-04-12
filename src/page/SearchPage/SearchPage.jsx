import { XIcon } from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Button from '@/components/primitives/Button';
import { SearchInput } from '@/components/primitives/forms';
import './SearchPage.css';

export const SearchPageHeaderContent = ({ onClosePage = null }) => (
  <Box
    direction="row"
    align="center"
    gap="6px"
    className="dq-search-page__header-content"
  >
    <SearchPageHeaderSearch />
    <Button
      className="dq-search-page__header-close"
      icon={XIcon}
      ariaLabel="Close search"
      variant="ghost"
      size="md"
      radius="rounded"
      onClick={onClosePage}
    />
  </Box>
);

const SearchPageHeaderSearch = () => (
  <SearchInput
    className="dq-search-page__header-input"
    ariaLabel="Search"
    placeholder="Search artist, duo, show..."
  />
);

const SearchPage = () => (
  <Alert
    variant="neutral"
    title="No results yet"
  >
    Try another artist, duo or show once the search data is connected.
  </Alert>
);

export default SearchPage;
