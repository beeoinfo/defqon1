import {
  CheckCircleIcon,
  CircleDashedIcon,
  InfoIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import Box from '../layout/Box';
import Title from '../primitives/Title';
import './Alert.css';

const ALERT_ICONS = {
  info: InfoIcon,
  warning: WarningCircleIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  neutral: CircleDashedIcon,
};

const Alert = ({
  component = 'div',
  variant = 'info',
  title,
  titleComponent = 'span',
  titleVariant = 'h5',
  actions,
  icon,
  role,
  className = '',
  children,
  style,
  ...props
}) => {
  const Component = component;
  const Icon = icon ?? ALERT_ICONS[variant] ?? InfoIcon;
  const hasActions = actions !== null && actions !== undefined && actions !== false;
  const resolvedRole = role ?? (variant === 'warning' || variant === 'error' ? 'alert' : 'status');

  return (
    <Box
      {...props}
      component={Component}
      background="surface"
      role={resolvedRole}
      className={['dq-alert', `dq-alert--${variant}`, className].filter(Boolean).join(' ')}
      style={{
        '--dq-layout-box-bg': 'var(--dq-alert-surface)',
        '--dq-layout-box-border': 'var(--dq-alert-border)',
        ...style,
      }}
    >
      <Box
        component="div"
        slot="content"
        direction="row"
        align="flex-start"
        gap="var(--dq-ui-space-lg)"
        className="dq-alert__inner"
      >
        <Box
          component="span"
          slot="content"
          justify="center"
          align="center"
          className="dq-alert__icon-shell"
        >
          <Icon
            aria-hidden="true"
            size={22}
            weight={variant === 'neutral' ? 'regular' : 'fill'}
          />
        </Box>

        <Box component="div" slot="content" gap="var(--dq-ui-space-sm)" className="dq-alert__content">
          {title ? (
            <Title
              component={titleComponent}
              variant={titleVariant}
              className="dq-alert__title"
            >
              {title}
            </Title>
          ) : null}

          {children ? (
            <Box component="div" slot="content" className="dq-alert__body">
              {children}
            </Box>
          ) : null}

          {hasActions ? (
            <Box
              component="div"
              slot="content"
              direction="row"
              wrap="wrap"
              gap="var(--dq-ui-space-md)"
              className="dq-alert__actions"
            >
              {actions}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

export default Alert;
