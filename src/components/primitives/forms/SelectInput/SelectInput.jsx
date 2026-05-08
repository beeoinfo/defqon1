import { useId } from 'react';
import Box from '../../../layout/Box';
import { buildFieldId, joinFieldIds } from '../fieldUtils';
import '../forms.css';
import './SelectInput.css';

const SelectInput = ({
  id,
  label,
  hideLabel = false,
  ariaLabel,
  description,
  errorMessage,
  successMessage,
  options = [],
  required = false,
  disabled = false,
  className = '',
  selectClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const selectId = buildFieldId({ id, generatedId, prefix: 'dq-ui-select-input' });
  const descriptionId = description ? `${selectId}-description` : undefined;
  const hasError = Boolean(errorMessage);
  const hasSuccess = !hasError && Boolean(successMessage);
  const statusMessage = hasError ? errorMessage : hasSuccess ? successMessage : '';
  const statusId = statusMessage ? `${selectId}-status` : undefined;
  const describedBy = joinFieldIds(descriptionId, statusId);

  return (
    <Box
      component="div"
      slot="content"
      gap="var(--dq-ui-space-sm)"
      className={[
        'dq-ui-form-field',
        'dq-ui-select-input',
        hasError ? 'dq-ui-select-input--error' : '',
        hasSuccess ? 'dq-ui-select-input--success' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label ? (
        <label
          htmlFor={selectId}
          className={[
            'dq-ui-form-field__label',
            hideLabel ? 'sr-only' : '',
          ].filter(Boolean).join(' ')}
        >
          {label}
          {required ? (
            <span className="dq-ui-form-field__required" aria-hidden="true">
              {' '}*
            </span>
          ) : null}
        </label>
      ) : null}

      <Box
        component="div"
        slot="content"
        className="dq-ui-form-control dq-ui-select-input__control"
      >
        <select
          {...props}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-label={!label ? ariaLabel : undefined}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          aria-errormessage={hasError ? statusId : undefined}
          className={['dq-ui-select-input__select', selectClassName].filter(Boolean).join(' ')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </Box>

      {description ? (
        <p id={descriptionId} className="dq-ui-form-field__description">
          {description}
        </p>
      ) : null}

      {statusMessage ? (
        <p
          id={statusId}
          className={[
            'dq-ui-form-field__status',
            hasError ? 'dq-ui-form-field__status--error' : 'dq-ui-form-field__status--success',
          ].join(' ')}
          role={hasError ? 'alert' : 'status'}
        >
          {statusMessage}
        </p>
      ) : null}
    </Box>
  );
};

export default SelectInput;
