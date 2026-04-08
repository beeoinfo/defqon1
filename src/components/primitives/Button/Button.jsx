import { cloneElement, forwardRef, isValidElement } from 'react';
import { buildGhostButtonColorVars } from '../../../lib/colorStyles';
import Badge from '../Badge';
import './Button.css';

const BUTTON_ICON_SIZES = {
  withLabel: {
    sm: 18,
    md: 22,
    lg: 22,
  },
  iconOnly: {
    sm: 20,
    md: 22,
    lg: 24,
  },
};

export const resolveButtonVisualState = ({
  children,
  icon: Icon = null,
  imageSrc = '',
  subtitle = '',
  size = 'md',
  radius = 'md',
  title,
  ariaLabel,
}) => {
  const hasLabel = children !== null && children !== undefined && children !== false;
  const resolvedSubtitle = size === 'lg' ? String(subtitle ?? '').trim() : '';
  const hasImage = size === 'lg' && Boolean(imageSrc);
  const isRichLarge = size === 'lg' && (Boolean(resolvedSubtitle) || hasImage);
  const isIconOnly = Boolean(Icon) && !hasLabel && !hasImage;
  const resolvedRadius = size === 'sm' ? 'rounded' : radius === 'rounded' ? 'rounded' : 'md';
  const iconSizeMap = isIconOnly ? BUTTON_ICON_SIZES.iconOnly : BUTTON_ICON_SIZES.withLabel;
  const iconSize = iconSizeMap[size] ?? iconSizeMap.md;
  const resolvedTitle = title ?? (isIconOnly ? ariaLabel : undefined);

  return {
    Icon,
    hasLabel,
    resolvedSubtitle,
    hasImage,
    isRichLarge,
    isIconOnly,
    resolvedRadius,
    iconSize,
    resolvedTitle,
  };
};

export const getButtonClassName = ({
  variant = 'ghost',
  size = 'md',
  resolvedRadius = 'md',
  selected = false,
  isRichLarge = false,
  hasImage = false,
  isIconOnly = false,
  hasBadge = false,
  className = '',
}) => (
  [
    'dq-ui-button',
    `dq-ui-button--${variant}`,
    `dq-ui-button--${size}`,
    `dq-ui-button--radius-${resolvedRadius}`,
    selected ? 'dq-ui-button--selected' : '',
    isRichLarge ? 'dq-ui-button--rich' : '',
    hasImage ? 'dq-ui-button--has-image' : '',
    isIconOnly ? 'dq-ui-button--icon-only' : '',
    hasBadge ? 'dq-ui-button--has-badge' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
);

const renderButtonBadge = (badge) => {
  if (badge === null || badge === undefined || badge === false) {
    return null;
  }

  if (isValidElement(badge)) {
    return cloneElement(badge, {
      className: [badge.props.className, 'dq-ui-button__badge'].filter(Boolean).join(' '),
    });
  }

  return (
    <Badge className="dq-ui-button__badge" variant="count">
      {badge}
    </Badge>
  );
};

export const ButtonContent = ({
  children,
  Icon = null,
  iconWeight,
  iconPosition = 'start',
  imageSrc = '',
  imageAlt = '',
  resolvedSubtitle = '',
  hasImage = false,
  hasLabel = false,
  iconSize = BUTTON_ICON_SIZES.withLabel.md,
}) => (
  <>
    {hasImage ? (
      <span className="dq-ui-button__media" aria-hidden="true">
        <img src={imageSrc} alt={imageAlt} />
      </span>
    ) : null}
    {Icon && iconPosition === 'start' ? (
      <span className="dq-ui-button__icon" aria-hidden="true">
        <Icon size={iconSize} {...(iconWeight ? { weight: iconWeight } : {})} />
      </span>
    ) : null}
    {hasLabel ? (
      resolvedSubtitle ? (
        <span className="dq-ui-button__content dq-ui-button__content--stacked">
          <span className="dq-ui-button__label">{children}</span>
          <span className="dq-ui-button__subtitle">{resolvedSubtitle}</span>
        </span>
      ) : (
        <span className="dq-ui-button__content">
          <span className="dq-ui-button__label">{children}</span>
        </span>
      )
    ) : null}
    {Icon && iconPosition === 'end' ? (
      <span className="dq-ui-button__icon" aria-hidden="true">
        <Icon size={iconSize} {...(iconWeight ? { weight: iconWeight } : {})} />
      </span>
    ) : null}
  </>
);

const Button = forwardRef(({
  children,
  icon: Icon = null,
  iconWeight,
  iconPosition = 'start',
  imageSrc = '',
  imageAlt = '',
  subtitle = '',
  selected = false,
  variant = 'ghost',
  size = 'md',
  radius = 'md',
  type = 'button',
  disabled = false,
  color,
  badge,
  className = '',
  ariaLabel,
  title,
  style,
  ...props
}, ref) => {
  const visualState = resolveButtonVisualState({
    children,
    icon: Icon,
    imageSrc,
    subtitle,
    size,
    radius,
    title,
    ariaLabel,
  });

  return (
    <button
      ref={ref}
      {...props}
      style={{
        ...(variant === 'ghost' && color ? buildGhostButtonColorVars(color) : {}),
        ...style,
      }}
      type={type}
      disabled={disabled}
      aria-label={visualState.isIconOnly ? ariaLabel : undefined}
      title={visualState.resolvedTitle}
      className={getButtonClassName({
        variant,
        size,
        resolvedRadius: visualState.resolvedRadius,
        selected,
        isRichLarge: visualState.isRichLarge,
        hasImage: visualState.hasImage,
        isIconOnly: visualState.isIconOnly,
        hasBadge: Boolean(badge),
        className,
      })}
    >
      <ButtonContent
        children={children}
        Icon={visualState.Icon}
        iconWeight={iconWeight}
        iconPosition={iconPosition}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        resolvedSubtitle={visualState.resolvedSubtitle}
        hasImage={visualState.hasImage}
        hasLabel={visualState.hasLabel}
        iconSize={visualState.iconSize}
      />
      {renderButtonBadge(badge)}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
