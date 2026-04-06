import './Badge.css';
import { buildColorTheme, getContrastTextColor } from '../../../lib/colorStyles';

export default function Badge({
  component = 'span',
  variant = 'ghost',
  color,
  backgroundColor,
  borderColor,
  textColor,
  className = '',
  children,
  style,
  ...props
}) {
  const Component = component;
  const resolvedVariant = variant === 'surface' ? 'ghost' : variant;
  const generatedTheme = color ? buildColorTheme(color) : null;
  const resolvedBackgroundColor =
    backgroundColor ??
    (resolvedVariant === 'plain'
      ? generatedTheme?.accent ?? '#ffffff'
      : resolvedVariant === 'count'
        ? generatedTheme?.accent
        : resolvedVariant === 'title'
          ? 'var(--dq-ui-danger-surface)'
        : generatedTheme?.accentSoft);
  const resolvedBorderColor =
    borderColor ??
    ((resolvedVariant === 'ghost' || resolvedVariant === 'title')
      ? resolvedVariant === 'title'
        ? 'var(--dq-ui-danger-border)'
        : generatedTheme?.accentBorder
      : undefined);
  const resolvedTextColor =
    textColor ??
    (resolvedVariant === 'plain'
      ? getContrastTextColor(resolvedBackgroundColor)
      : resolvedVariant === 'count'
        ? '#ffffff'
      : resolvedVariant === 'title'
        ? 'var(--dq-ui-accent-soft)'
      : generatedTheme?.accentText);

  return (
    <Component
      {...props}
      className={['dq-ui-badge', `dq-ui-badge--${resolvedVariant}`, className].filter(Boolean).join(' ')}
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
}
