import './Box.css';
import Title from '../../primitives/Title/index';

export default function Box({
  component = 'div',
  background = 'none',
  direction = 'column',
  gap = 'var(--dq-ui-space-lg)',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  title,
  titleComponent = 'h2',
  titleVariant = 'h4',
  variant = 'plain',
  className = '',
  children,
  style,
  slot,
  ...props
}) {
  const contentStyle = {
    '--dq-layout-box-direction': direction,
    '--dq-layout-box-gap': gap,
    '--dq-layout-box-justify': justify,
    '--dq-layout-box-align': align,
    '--dq-layout-box-wrap': wrap,
  };

  if (slot === 'content') {
    const ContentComponent = component;

    return (
      <ContentComponent
        {...props}
        className={['dq-layout-box__content', className].filter(Boolean).join(' ')}
        style={{
          ...contentStyle,
          ...style,
        }}
      >
        {children}
      </ContentComponent>
    );
  }

  const Component = component;
  const resolvedBackground =
    variant !== 'plain' && background === 'none'
      ? variant === 'background'
        ? 'surface'
        : variant
      : background;

  if (!title) {
    return (
      <Component
        {...props}
        className={['dq-layout-box', 'dq-layout-box--content-root', `dq-layout-box--${resolvedBackground}`, className]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...contentStyle,
          ...style,
        }}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      {...props}
      className={['dq-layout-box', `dq-layout-box--${resolvedBackground}`, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {title ? (
        <Title component={titleComponent} variant={titleVariant} className="dq-layout-box__title">
          {title}
        </Title>
      ) : null}
      <Box
        component="div"
        slot="content"
        direction={direction}
        gap={gap}
        justify={justify}
        align={align}
        wrap={wrap}
      >
        {children}
      </Box>
    </Component>
  );
}
