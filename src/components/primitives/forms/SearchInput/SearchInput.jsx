import { useId } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import Box from '../../../layout/Box';
import { buildFieldId } from '../fieldUtils';
import '../forms.css';
import './SearchInput.css';

const SearchInput = ({
  id,
  label = 'Search',
  hideLabel = true,
  ariaLabel,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = buildFieldId({ id, generatedId, prefix: 'dq-ui-search-input' });

  return (
    <Box
      component="div"
      slot="content"
      gap="var(--dq-ui-space-sm)"
      className={['dq-ui-form-field', 'dq-ui-search-input', className].filter(Boolean).join(' ')}
    >
      {label ? (
        <label
          htmlFor={inputId}
          className={[
            'dq-ui-form-field__label',
            hideLabel ? 'sr-only' : '',
          ].filter(Boolean).join(' ')}
        >
          {label}
        </label>
      ) : null}

      <Box
        component="div"
        slot="content"
        align="center"
        direction="row"
        gap="var(--dq-ui-space-md)"
        className="dq-ui-form-control dq-ui-search-input__control"
      >
        <Box
          component="span"
          slot="content"
          justify="center"
          align="center"
          className="dq-ui-search-input__icon-shell"
        >
          <MagnifyingGlassIcon aria-hidden="true" size={18} />
        </Box>

        <input
          {...props}
          id={inputId}
          type="search"
          aria-label={!label ? ariaLabel : undefined}
          className={['dq-ui-search-input__input', inputClassName].filter(Boolean).join(' ')}
        />
      </Box>
    </Box>
  );
};

export default SearchInput;
