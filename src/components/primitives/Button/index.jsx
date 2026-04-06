import './Button.css';

const BUTTON_ICON_SIZES = {
  withLabel: {
    sm: 14,
    md: 18,
    lg: 18,
  },
  iconOnly: {
    sm: 16,
    md: 18,
    lg: 20,
  },
};

export function resolveButtonVisualState({
  children,
  icon: Icon = null,
  imageSrc = '',
  subtitle = '',
  size = 'md',
  radius = 'md',
  title,
  ariaLabel,
}) {
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
}

export function getButtonClassName({
  variant = 'ghost',
  size = 'md',
  resolvedRadius = 'md',
  selected = false,
  isRichLarge = false,
  hasImage = false,
  isIconOnly = false,
  className = '',
}) {
  return [
    'dq-ui-button',
    `dq-ui-button--${variant}`,
    `dq-ui-button--${size}`,
    `dq-ui-button--radius-${resolvedRadius}`,
    selected ? 'dq-ui-button--selected' : '',
    isRichLarge ? 'dq-ui-button--rich' : '',
    hasImage ? 'dq-ui-button--has-image' : '',
    isIconOnly ? 'dq-ui-button--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function ButtonContent({
  children,
  Icon = null,
  iconPosition = 'start',
  imageSrc = '',
  imageAlt = '',
  resolvedSubtitle = '',
  hasImage = false,
  hasLabel = false,
  iconSize = BUTTON_ICON_SIZES.withLabel.md,
}) {
  return (
    <>
      {hasImage ? (
        <span className="dq-ui-button__media" aria-hidden="true">
          <img src={imageSrc} alt={imageAlt} />
        </span>
      ) : null}
      {Icon && iconPosition === 'start' ? (
        <span className="dq-ui-button__icon" aria-hidden="true">
          <Icon size={iconSize} />
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
          <Icon size={iconSize} />
        </span>
      ) : null}
    </>
  );
}

export default function Button({
  children,
  icon: Icon = null,
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
  className = '',
  ariaLabel,
  title,
  ...props
}) {
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
      {...props}
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
        className,
      })}
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
    </button>
  );
}
