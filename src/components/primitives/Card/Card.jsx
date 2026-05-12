import { Children } from 'react';
import { HeartIcon, PencilSimpleIcon, StarIcon, XIcon } from '@phosphor-icons/react';
import { mixColors, parseColor, rgbaString } from '../../../lib/colorStyles';
import Button from '../../primitives/Button';
import ToggleButton from '../../primitives/ToggleButton';
import Title from '../../primitives/Title';
import Box from '@/components/layout/Box';
import './Card.css';

const CARD_BG_BASE = '#09090b';

const Card = ({
  component = 'article',
  color,
  title,
  titleComponent = 'h3',
  titleVariant = 'h6',
  meta1,
  meta2,
  meta3,
  metaVariant,
  underTitle = null,
  underMeta = null,
  description,
  error,
  actionVariant = 'favorite',
  actionPressed = false,
  actionAriaLabel,
  onAction,
  className = '',
  children,
  style,
  ...props
}) => {
  const Component = component;
  const isSubCard = component === 'div';

  // Sub-card with color: opaque mix for card-in-card compositing
  // Standalone card with own color: doubled transparency (like two stacked transparent layers)
  const cardColorStyle = color
    ? isSubCard
      ? (() => {
          const mixedBg = parseColor(mixColors(CARD_BG_BASE, color, 0.45));
          const mixedBorder = parseColor(mixColors(CARD_BG_BASE, color, 0.57));
          return {
            '--dq-layout-card-bg': `rgba(${mixedBg.r}, ${mixedBg.g}, ${mixedBg.b}, 0.85)`,
            '--dq-layout-card-border': `rgba(${mixedBorder.r}, ${mixedBorder.g}, ${mixedBorder.b}, 0.85)`,
          };
        })()
      : {
          '--dq-layout-card-bg': rgbaString(color, 0.29),
          '--dq-layout-card-border': rgbaString(color, 0.48),
        }
    : {};

  const metaParts = [meta1, meta2, meta3].filter(Boolean);
  const hasMeta = metaParts.length > 0;
  const hasUnderTitle = underTitle !== null && underTitle !== undefined && underTitle !== false;
  const hasUnderMeta = underMeta !== null && underMeta !== undefined && underMeta !== false;
  const bodyChildren = Children.toArray(children);
  const hasBody = Boolean(description) || bodyChildren.length > 0;

  const actionElement = actionVariant === 'close'
    ? <Button icon={XIcon} ariaLabel={actionAriaLabel ?? 'Close'} size="sm" radius="rounded" onClick={onAction} />
      : actionVariant === 'favorite'
      ? (
        <ToggleButton
          variant="favorite"
          icon={StarIcon}
          pressed={actionPressed}
          fillOnPress
          ariaLabel={actionAriaLabel ?? 'Favorite'}
          onPressedChange={onAction}
        />
      )
      : actionVariant === 'likes'
        ? (
          <ToggleButton
            variant="likes"
            icon={HeartIcon}
            pressed={actionPressed}
            fillOnPress
            ariaLabel={actionAriaLabel ?? 'Like'}
            onPressedChange={onAction}
          />
        )
        : actionVariant === 'liked'
          ? (
            <span className="dq-layout-card__readonly-like" aria-label={actionAriaLabel ?? 'Liked'}>
              <HeartIcon weight="fill" />
            </span>
          )
          : actionVariant === 'edit'
            ? (
              <Button
                icon={PencilSimpleIcon}
                ariaLabel={actionAriaLabel ?? 'Edit'}
                size="sm"
                radius="rounded"
                onClick={onAction}
              />
            )
      : null;

  return (
    <Component
      {...props}
      className={['dq-layout-card', className].filter(Boolean).join(' ')}
      style={{ ...cardColorStyle, ...style }}
    >
      <Box
        slot="content"
        direction="row"
        align="flex-start"
        gap="var(--dq-ui-space-sm)"
        className="dq-layout-card__head"
      >
        <Box
          slot="content"
          direction="column"
          gap="4px"
          className="dq-layout-card__head-content"
        >
          {title ? (
            <Title
              component={titleComponent}
              variant={titleVariant}
              className="dq-layout-card__title"
              translate="no"
            >
              {title}
            </Title>
          ) : null}
          {hasUnderTitle ? underTitle : null}
          {hasMeta ? (
            <Box
              slot="content"
              direction="row"
              wrap="wrap"
              align="center"
              gap="2px 0"
              className={['dq-layout-card__meta', metaVariant === 'strikethrough' ? 'dq-layout-card__meta--strikethrough' : ''].filter(Boolean).join(' ')}
            >
              {metaParts.map((part, index) => (
                <span
                  key={index}
                  className="dq-layout-card__meta-item"
                  translate={index === 0 ? 'no' : undefined}
                >
                  {part}
                </span>
              ))}
            </Box>
          ) : null}
          {hasUnderMeta ? (
            <Box slot="content" className="dq-layout-card__under-meta">
              {underMeta}
            </Box>
          ) : null}
        </Box>
        {actionElement ? (
          <Box slot="content" className="dq-layout-card__action">
            {actionElement}
          </Box>
        ) : null}
      </Box>
      {hasBody ? (
        <>
          <hr className="dq-layout-card__divider" />
          <Box
            slot="content"
            direction="column"
            gap="var(--dq-ui-space-sm)"
            className="dq-layout-card__body"
          >
            {description ? (
              <p className={['dq-layout-card__description', error ? 'dq-layout-card__description--error' : ''].filter(Boolean).join(' ')}>{description}</p>
            ) : null}
            {bodyChildren}
          </Box>
        </>
      ) : null}
    </Component>
  );
};

export default Card;
