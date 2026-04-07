import { useState } from 'react';
import '../ToggleButton/ToggleButton.css';
import './ChoiceButton.css';
import {
  ButtonContent,
  getButtonClassName,
  resolveButtonVisualState,
} from '../Button/index';
import { resolveToggleIcons } from '../ToggleButton/index';
import { buildGhostButtonColorVars } from '../../../lib/colorStyles';

export default function ChoiceButton({
  children,
  type = 'checkbox',
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  name,
  value,
  icon = null,
  selectedIcon = null,
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
}) {
  const [internalChecked, setInternalChecked] = useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const resolvedIcons = resolveToggleIcons({
    variant,
    icon,
    selectedIcon,
    pressed: isChecked,
  });
  const visualState = resolveButtonVisualState({
    children,
    icon: resolvedIcons.currentIcon ?? resolvedIcons.icon,
    imageSrc,
    subtitle,
    size,
    radius,
    title,
    ariaLabel,
  });

  function handleChange(event) {
    if (!isControlled) {
      setInternalChecked(event.target.checked);
    }

    onCheckedChange?.(event.target.checked, event);
    onChange?.(event);
  }

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
        checked={checked}
        defaultChecked={defaultChecked}
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
            selected: isChecked,
            isRichLarge: visualState.isRichLarge,
            hasImage: visualState.hasImage,
            isIconOnly: visualState.isIconOnly,
          }),
          variant === 'favorite' ? 'dq-ui-toggle-button--favorite' : '',
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
}
