import { useId, useState } from 'react';
import Box from '../../../layout/Box';
import { buildFieldId, joinFieldIds } from '../fieldUtils';
import '../forms.css';
import './CheckboxInput.css';

const CheckboxInput = ({
  id,
  label,
  ariaLabel,
  description,
  checked,
  defaultChecked = false,
  onCheckedChange,
  onChange,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = buildFieldId({ id, generatedId, prefix: 'dq-ui-checkbox-input' });
  const descriptionId = description ? `${inputId}-description` : undefined;
  const [internalChecked, setInternalChecked] = useState(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleChange = (event) => {
    if (!isControlled) {
      setInternalChecked(event.target.checked);
    }

    onCheckedChange?.(event.target.checked, event);
    onChange?.(event);
  };

  return (
    <Box
      component="label"
      slot="content"
      direction="row"
      align="flex-start"
      gap="var(--dq-ui-space-md)"
      className={[
        'dq-ui-checkbox-input',
        disabled ? 'dq-ui-checkbox-input--disabled' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <input
        {...props}
        id={inputId}
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        aria-label={!label ? ariaLabel : undefined}
        aria-describedby={joinFieldIds(descriptionId)}
        className="dq-ui-checkbox-input__input"
      />
      <span className="dq-ui-checkbox-input__indicator" aria-hidden="true" />
      <Box
        component="span"
        slot="content"
        gap="var(--dq-ui-space-xs)"
        className="dq-ui-checkbox-input__content"
      >
        {label ? (
          <span className="dq-ui-form-field__label">
            {label}
            {required ? (
              <span className="dq-ui-form-field__required" aria-hidden="true">
                {' '}*
              </span>
            ) : null}
          </span>
        ) : null}
        {description ? (
          <span id={descriptionId} className="dq-ui-form-field__description">
            {description}
          </span>
        ) : null}
      </Box>
    </Box>
  );
};

export default CheckboxInput;
