import { useState } from 'react';
import { buildGhostButtonColorVars } from '../../../lib/colorStyles';
import {
  ButtonContent,
  getButtonClassName,
  resolveButtonVisualState,
} from '../Button';
import { resolveIconProps } from '../ToggleButton';
import '../ToggleButton/ToggleButton.css';
import './ChoiceButton.css';

const ChoiceButton = ({
  children,
  type = 'checkbox',
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  name,
  value,
  icon = null,
  fillOnPress = false,
  iconPosition = 'start',
  imageSrc = '',
  imageAlt = '',
  subtitle = '',
  variant = 'ghost',
  size = 'md',
  radius = 'md',
  disabled = false,
  color,
  className = '',
  ariaLabel,
  title,
  ...props
}) => {
  const [internalChecked, setInternalChecked] = useState(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const iconProps = resolveIconProps({ icon, pressed: isChecked, fillOnPress });
  const visualState = resolveButtonVisualState({
    children,
    icon: iconProps.Icon,
    imageSrc,
    subtitle,
    size,
    radius,
    title,
    ariaLabel,
  });

  const handleChange = (event) => {
    if (!isControlled && type !== 'radio') {
      setInternalChecked(event.target.checked);
    }

    onCheckedChange?.(event.target.checked, event);
    onChange?.(event);
  };

  return (
    <label
      className={[
        'dq-ui-choice-button',
        `dq-ui-choice-button--${variant}`,
        variant === 'favorite' ? 'dq-ui-toggle-button--favorite' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        {...props}
        className="dq-ui-choice-button__input"
        type={type}
        {...(isControlled ? { checked: isChecked } : {})}
        {...(type !== 'radio' && !isControlled ? { defaultChecked: isChecked } : {})}
        onChange={handleChange}
        name={name}
        value={value}
        disabled={disabled}
        aria-label={visualState.isIconOnly ? ariaLabel : undefined}
      />
      <span
        className={[
          getButtonClassName({
            variant: variant === 'favorite' ? 'ghost' : variant,
            size,
            resolvedRadius: visualState.resolvedRadius,
            selected: type !== 'radio' && isChecked,
            isRichLarge: visualState.isRichLarge,
            hasImage: visualState.hasImage,
            isIconOnly: visualState.isIconOnly,
          }),
          variant === 'favorite' ? 'dq-ui-toggle-button--favorite' : '',
          fillOnPress ? 'dq-ui-toggle-button--fill-on-press' : '',
          'dq-ui-choice-button__control',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...((variant === 'ghost' || variant === 'favorite') && color
            ? buildGhostButtonColorVars(color)
            : {}),
        }}
        title={visualState.resolvedTitle}
      >
        <ButtonContent
          children={children}
          Icon={visualState.Icon}
          iconPosition={iconPosition}
          iconWeight={iconProps.iconWeight}
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          resolvedSubtitle={visualState.resolvedSubtitle}
          hasImage={visualState.hasImage}
          hasLabel={visualState.hasLabel}
          iconSize={visualState.iconSize}
        />
      </span>
    </label>
  );
};

export default ChoiceButton;
