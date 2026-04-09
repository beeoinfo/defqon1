import { useId } from 'react';
import Box from '../../../layout/Box';
import { buildFieldId, joinFieldIds } from '../fieldUtils';
import '../forms.css';
import './TextInput.css';

const TextInput = ({
  id,
  label,
  hideLabel = false,
  ariaLabel,
  description,
  errorMessage,
  successMessage,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = buildFieldId({ id, generatedId, prefix: 'dq-ui-text-input' });
  const descriptionId = description ? `${inputId}-description` : undefined;
  const hasError = Boolean(errorMessage);
  const hasSuccess = !hasError && Boolean(successMessage);
  const statusMessage = hasError ? errorMessage : hasSuccess ? successMessage : '';
  const statusId = statusMessage ? `${inputId}-status` : undefined;
  const describedBy = joinFieldIds(descriptionId, statusId);

  return (
    <Box
      component="div"
      slot="content"
      gap="var(--dq-ui-space-sm)"
      className={[
        'dq-ui-form-field',
        'dq-ui-text-input',
        hasError ? 'dq-ui-text-input--error' : '',
        hasSuccess ? 'dq-ui-text-input--success' : '',
        className,
      ].filter(Boolean).join(' ')}
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
        className="dq-ui-form-control dq-ui-text-input__control"
      >
        <input
          {...props}
          id={inputId}
          type={type}
          required={required}
          disabled={disabled}
          aria-label={!label ? ariaLabel : undefined}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          aria-errormessage={hasError ? statusId : undefined}
          className={['dq-ui-text-input__input', inputClassName].filter(Boolean).join(' ')}
        />
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

export default TextInput;
