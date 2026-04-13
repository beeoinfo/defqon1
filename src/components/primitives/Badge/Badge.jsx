import { buildColorTheme, getContrastTextColor } from '../../../lib/colorStyles';
import './Badge.css';

const Badge = ({
  component = 'span',
  variant = 'ghost',
  size,
  color,
  backgroundColor,
  borderColor,
  textColor,
  className = '',
  children,
  style,
  ...props
}) => {
  const Component = component;
  const resolvedVariant = variant === 'surface' ? 'ghost' : variant;
  const isFloatingVariant = resolvedVariant === 'floating';
  const generatedTheme = color ? buildColorTheme(color) : null;
  const resolvedBackgroundColor =
    backgroundColor ??
    (resolvedVariant === 'plain'
      ? generatedTheme?.accent ?? 'var(--dq-ui-color-white)'
      : resolvedVariant === 'count'
        ? generatedTheme?.accent
        : resolvedVariant === 'title'
          ? 'var(--dq-ui-danger-surface)'
          : isFloatingVariant
            ? 'var(--dq-ui-background-blur-surface)'
          : generatedTheme?.accentSoft);
  const resolvedBorderColor =
    borderColor ??
    ((resolvedVariant === 'ghost' || resolvedVariant === 'title' || isFloatingVariant)
      ? resolvedVariant === 'title'
        ? 'var(--dq-ui-danger-border)'
        : generatedTheme?.accentBorder ?? 'var(--dq-ui-border)'
      : undefined);
  const resolvedTextColor =
    textColor ??
    (resolvedVariant === 'plain'
      ? getContrastTextColor(resolvedBackgroundColor)
      : resolvedVariant === 'count'
        ? 'var(--dq-ui-color-white)'
        : resolvedVariant === 'title'
          ? 'var(--dq-ui-accent-soft)'
          : generatedTheme?.accentText ?? 'var(--dq-ui-text)');

  return (
    <Component
      {...props}
      className={['dq-ui-badge', `dq-ui-badge--${resolvedVariant}`, size === 'sm' ? 'dq-ui-badge--sm' : '', className].filter(Boolean).join(' ')}
      style={{
        '--dq-ui-badge-bg': resolvedBackgroundColor,
        '--dq-ui-badge-border': resolvedBorderColor,
        '--dq-ui-badge-text': resolvedTextColor,
        ...style,
      }}
    >
      {children}
    </Component>
  );
};

export default Badge;
