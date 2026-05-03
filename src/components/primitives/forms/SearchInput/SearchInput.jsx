import { useId, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import Box from '../../../layout/Box';
import { buildFieldId } from '../fieldUtils';
import '../forms.css';
import './SearchInput.css';

const SearchInput = ({
  id,
  label = 'Search',
  hideLabel = true,
  ariaLabel,
  value,
  defaultValue = '',
  onChange,
  onClear,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const inputRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputId = buildFieldId({ id, generatedId, prefix: 'dq-ui-search-input' });
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasValue = String(currentValue ?? '').length > 0;

  const handleChange = (event) => {
    if (!isControlled) {
      setInternalValue(event.target.value);
    }

    onChange?.(event);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }

    if (onClear) {
      onClear();
    } else {
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      });
    }
    inputRef.current?.focus();
  };

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
          ref={inputRef}
          id={inputId}
          type="search"
          value={currentValue}
          aria-label={!label ? ariaLabel : undefined}
          onChange={handleChange}
          className={['dq-ui-search-input__input', inputClassName].filter(Boolean).join(' ')}
        />

        {hasValue ? (
          <button
            type="button"
            className="dq-ui-search-input__clear-button"
            aria-label="Clear search"
            onClick={handleClear}
          >
            <XIcon aria-hidden="true" size={16} />
          </button>
        ) : null}
      </Box>
    </Box>
  );
};

export default SearchInput;
