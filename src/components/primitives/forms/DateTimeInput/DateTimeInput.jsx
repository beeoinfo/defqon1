import Box from '../../../layout/Box';
import TextInput from '../TextInput';
import '../forms.css';
import './DateTimeInput.css';

const DateTimeInput = ({
  label,
  dateValue = '',
  timeValue = '',
  onDateChange,
  onTimeChange,
  required = false,
  disabled = false,
  dateErrorMessage,
  timeErrorMessage,
  className = '',
}) => (
  <Box
    component="fieldset"
    slot="content"
    className={['dq-ui-form-field', 'dq-ui-date-time-input', className].filter(Boolean).join(' ')}
    gap="var(--dq-ui-space-sm)"
  >
    {label ? (
      <legend className="dq-ui-form-field__label">
        {label}
        {required ? (
          <span className="dq-ui-form-field__required" aria-hidden="true">
            {' '}*
          </span>
        ) : null}
      </legend>
    ) : null}

    <Box
      component="div"
      slot="content"
      direction="row"
      wrap="wrap"
      gap="var(--dq-ui-space-sm)"
      className="dq-ui-date-time-input__fields"
    >
      <TextInput
        label={label ? `${label} date` : 'Date'}
        hideLabel
        type="date"
        value={dateValue}
        required={required}
        disabled={disabled}
        errorMessage={dateErrorMessage}
        onChange={(event) => onDateChange?.(event.target.value)}
      />
      <TextInput
        label={label ? `${label} time` : 'Time'}
        hideLabel
        type="time"
        value={timeValue}
        required={required}
        disabled={disabled}
        errorMessage={timeErrorMessage}
        onChange={(event) => onTimeChange?.(event.target.value)}
      />
    </Box>
  </Box>
);

export default DateTimeInput;
