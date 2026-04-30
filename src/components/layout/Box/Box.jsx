import { forwardRef } from 'react';
import { buildColorTheme } from '../../../lib/colorStyles';
import Badge from '../../primitives/Badge';
import Title from '../../primitives/Title';
import './Box.css';

const Box = forwardRef(({
  component = 'div',
  background = 'none',
  color,
  layout = 'flex',
  maxColumns,
  direction = 'column',
  gap,
  justify = 'flex-start',
  align = 'stretch',
  alignContent = 'stretch',
  wrap = 'nowrap',
  title,
  titleBadge = false,
  titleIcon,
  titleComponent = 'h2',
  titleVariant = 'h4',
  titleCount,
  titleCountLabel,
  variant = 'plain',
  className = '',
  children,
  style,
  slot,
  ...props
}, ref) => {
  const defaultGap = component === 'main' ? '40px' : 'var(--dq-ui-space-lg)';
  const resolvedGap = gap ?? defaultGap;
  const parsedMaxColumns = Number(maxColumns);
  const hasExplicitMaxColumns = Number.isFinite(parsedMaxColumns) && parsedMaxColumns > 0;
  const resolvedLayout = layout === 'columns' ? 'columns' : 'flex';
  const resolvedMaxColumns =
    resolvedLayout === 'columns'
      ? Math.min(Math.floor(hasExplicitMaxColumns ? parsedMaxColumns : 4), 4)
      : hasExplicitMaxColumns
        ? Math.min(Math.floor(parsedMaxColumns), 4)
        : null;
  const columnStyle = resolvedMaxColumns
    ? {
        '--dq-layout-box-columns-desktop': resolvedMaxColumns,
        '--dq-layout-box-columns-laptop': Math.min(resolvedMaxColumns, 3),
        '--dq-layout-box-columns-tablet': Math.min(resolvedMaxColumns, 2),
        '--dq-layout-box-columns-phone': 1,
      }
    : {};
  const contentStyle = {
    '--dq-layout-box-direction': direction,
    '--dq-layout-box-gap': resolvedGap,
    '--dq-layout-box-justify': justify,
    '--dq-layout-box-align': align,
    '--dq-layout-box-align-content': alignContent,
    '--dq-layout-box-wrap': wrap,
    ...columnStyle,
  };
  const layoutClasses = [
    `dq-layout-box--layout-${resolvedLayout}`,
    resolvedMaxColumns ? 'dq-layout-box--max-columns' : '',
  ];

  if (slot === 'content') {
    const ContentComponent = component;

    return (
      <ContentComponent
        {...props}
        ref={ref}
        className={['dq-layout-box__content', ...layoutClasses, className].filter(Boolean).join(' ')}
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
  const colorTheme = color ? buildColorTheme(color) : null;
  const boxColorStyle = colorTheme && resolvedBackground !== 'none'
    ? {
        '--dq-layout-box-bg': colorTheme.accentSoft,
        '--dq-layout-box-border': colorTheme.accentBorder,
      }
    : {};
  const boxStyle = {
    ...boxColorStyle,
    ...style,
  };
  const hasTitleMeta = titleCount !== null && titleCount !== undefined;
  const TitleIcon = titleIcon;
  const hasTitleBadge =
    titleBadge !== null &&
    titleBadge !== undefined &&
    titleBadge !== false &&
    titleBadge !== true &&
    titleBadge !== '';
  const hasTitleSlot = Boolean(title) || Boolean(TitleIcon) || hasTitleBadge;
  const hasHeader = hasTitleSlot || hasTitleMeta;
  const showsTitleIcon = Boolean(TitleIcon) && !hasTitleBadge;
  const hasTitleLeading = hasTitleBadge || showsTitleIcon;
  const titleClassName = [
    'dq-layout-box__title',
    hasTitleLeading ? 'dq-layout-box__title--with-leading' : 'dq-layout-box__title--compact',
  ]
    .filter(Boolean)
    .join(' ');

  if (!hasHeader) {
    return (
      <Component
        {...props}
        ref={ref}
        className={[
          'dq-layout-box',
          'dq-layout-box--content-root',
          `dq-layout-box--${resolvedBackground}`,
          ...layoutClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...boxColorStyle,
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
      ref={ref}
      className={['dq-layout-box', `dq-layout-box--${resolvedBackground}`, className]
        .filter(Boolean)
        .join(' ')}
      style={boxStyle}
    >
      <Box
        component="header"
        slot="content"
        direction="column"
        gap="0"
        justify="flex-start"
        align="stretch"
        className="dq-layout-box__header"
      >
        {hasTitleLeading ? (
          <Box
            component="span"
            slot="content"
            direction="row"
            gap="var(--dq-ui-space-sm)"
            align="center"
            wrap="wrap"
            className="dq-layout-box__title-main"
          >
            <Box
              component="span"
              slot="content"
              direction="row"
              gap="var(--dq-ui-space-sm)"
              align="center"
              className="dq-layout-box__title-leading"
            >
              {hasTitleBadge ? (
                <Badge variant="plain" color={color} className="dq-layout-box__title-badge">
                  {titleBadge}
                </Badge>
              ) : null}
              {showsTitleIcon ? (
                <Title component="span" variant={titleVariant} className="dq-layout-box__title-icon">
                  <TitleIcon aria-hidden="true" focusable="false" />
                </Title>
              ) : null}
            </Box>
            {title ? (
              <Title component={titleComponent} variant={titleVariant} className={titleClassName}>
                {title}
              </Title>
            ) : null}
          </Box>
        ) : null}
        {!hasTitleLeading && title ? (
          <Title component={titleComponent} variant={titleVariant} className={titleClassName}>
            {title}
          </Title>
        ) : null}
        {hasTitleMeta ? (
          <span className="dq-layout-box__title-meta">
            <span className="dq-layout-box__title-count">{titleCount}</span>
            {titleCountLabel ? <span>{titleCountLabel}</span> : null}
          </span>
        ) : null}
      </Box>
      <Box
        component="div"
        slot="content"
        direction={direction}
        gap={gap}
        justify={justify}
        align={align}
        alignContent={alignContent}
        wrap={wrap}
        layout={resolvedLayout}
        maxColumns={resolvedMaxColumns}
      >
        {children}
      </Box>
    </Component>
  );
});

Box.displayName = 'Box';

export default Box;
