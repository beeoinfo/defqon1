import { useId, useState } from 'react';
import Box from '../../../layout/Box';
import { buildFieldId, joinFieldIds } from '../fieldUtils';
import '../forms.css';
import './Switch.css';

const Switch = ({
  id,
  label,
  ariaLabel,
  description,
  checked,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const switchId = buildFieldId({ id, generatedId, prefix: 'dq-ui-switch' });
  const labelId = label ? `${switchId}-label` : undefined;
  const descriptionId = description ? `${switchId}-description` : undefined;
  const [internalChecked, setInternalChecked] = useState(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleClick = (event) => {
    const nextChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onCheckedChange?.(nextChecked, event);
    onClick?.(event);
  };

  return (
    <Box
      {...props}
      component="button"
      type="button"
      slot="content"
      direction="row"
      justify="space-between"
      align="center"
      gap="var(--dq-ui-space-lg)"
      role="switch"
      aria-checked={isChecked}
      aria-labelledby={labelId}
      aria-describedby={joinFieldIds(descriptionId)}
      aria-label={!label ? ariaLabel : undefined}
      disabled={disabled}
      className={[
        'dq-ui-switch',
        isChecked ? 'dq-ui-switch--checked' : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
    >
      <Box
        component="span"
        slot="content"
        gap="var(--dq-ui-space-xs)"
        className="dq-ui-switch__copy"
      >
        {label ? (
          <span id={labelId} className="dq-ui-form-field__label">
            {label}
          </span>
        ) : null}
        {description ? (
          <span id={descriptionId} className="dq-ui-form-field__description">
            {description}
          </span>
        ) : null}
      </Box>
      <span className="dq-ui-switch__track" aria-hidden="true">
        <span className="dq-ui-switch__thumb" />
      </span>
    </Box>
  );
};

export default Switch;
