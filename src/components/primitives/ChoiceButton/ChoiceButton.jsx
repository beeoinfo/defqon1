import { useState } from 'react';
import { buildGhostButtonColorVars } from '../../../lib/colorStyles';
import {
  ButtonContent,
  getButtonClassName,
  resolveButtonVisualState,
} from '../Button';
import Badge from '../Badge';
import { isToggleAccentVariant, resolveIconProps } from '../ToggleButton';
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
  selectedIcon = null,
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
  tag = null,
  tagVariant = 'ghost',
  className = '',
  ariaLabel,
  title,
  labelTranslate,
  ...props
}) => {
  const [internalChecked, setInternalChecked] = useState(() => Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const effectiveVariant = selectedIcon ? 'ghost' : variant;
  const buttonIcon = selectedIcon ? null : icon;
  const SelectedIcon = selectedIcon;
  const iconProps = resolveIconProps({ icon: buttonIcon, pressed: isChecked, fillOnPress });
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
  const hasTag = Boolean(tag);

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
        `dq-ui-choice-button--${effectiveVariant}`,
        isToggleAccentVariant(effectiveVariant) ? `dq-ui-toggle-button--${effectiveVariant}` : '',
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
            variant: isToggleAccentVariant(effectiveVariant) ? 'ghost' : effectiveVariant,
            size,
            resolvedRadius: visualState.resolvedRadius,
            selected: type !== 'radio' && isChecked,
            isRichLarge: visualState.isRichLarge,
            hasImage: visualState.hasImage,
            isIconOnly: visualState.isIconOnly,
            hasBadge: hasTag,
          }),
          isToggleAccentVariant(effectiveVariant) ? `dq-ui-toggle-button--${effectiveVariant}` : '',
          fillOnPress ? 'dq-ui-toggle-button--fill-on-press' : '',
          selectedIcon ? 'dq-ui-choice-button__control--selected-icon' : '',
          'dq-ui-choice-button__control',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...((effectiveVariant === 'ghost' || isToggleAccentVariant(effectiveVariant)) && !selectedIcon && color
            ? buildGhostButtonColorVars(color)
            : {}),
          ...(selectedIcon ? {
            '--dq-ui-button-selected-bg': 'var(--dq-ui-success-surface)',
            '--dq-ui-button-selected-border-color': 'var(--dq-ui-success-border)',
            '--dq-ui-button-selected-text-color': 'var(--dq-ui-success)',
            '--dq-ui-button-selected-hover-bg': 'var(--dq-ui-success-surface)',
            '--dq-ui-button-selected-hover-border-color': 'var(--dq-ui-success-border)',
            '--dq-ui-button-selected-hover-text-color': 'var(--dq-ui-success)',
            '--dq-ui-button-selected-focus-bg': 'var(--dq-ui-success-surface)',
            '--dq-ui-button-selected-focus-border-color': 'var(--dq-ui-success-border)',
            '--dq-ui-button-selected-focus-text-color': 'var(--dq-ui-success)',
            '--dq-ui-button-selected-active-bg': 'var(--dq-ui-success-surface)',
            '--dq-ui-button-selected-active-border-color': 'var(--dq-ui-success-border)',
            '--dq-ui-button-selected-active-text-color': 'var(--dq-ui-success)',
          } : {}),
        }}
        title={visualState.resolvedTitle}
        translate={labelTranslate}
      >
        {selectedIcon ? (
          <span
            className="dq-ui-choice-button__selected-icon"
            aria-hidden="true"
            style={{ '--dq-ui-choice-button-selected-icon-size': `${visualState.iconSize}px` }}
          >
            <SelectedIcon size={visualState.iconSize} />
          </span>
        ) : null}
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
        {hasTag ? (
          <Badge size="sm" variant={tagVariant} className="dq-ui-choice-button__tag">
            {tag}
          </Badge>
        ) : null}
      </span>
    </label>
  );
};

export default ChoiceButton;
