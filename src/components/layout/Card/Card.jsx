import { StarIcon, XIcon } from '@phosphor-icons/react';
import { mixColors, parseColor, rgbaString } from '../../../lib/colorStyles';
import { dqUiTokens } from '../../../theme/tokens';
import Button from '../../primitives/Button';
import ToggleButton from '../../primitives/ToggleButton';
import Title from '../../primitives/Title';
import Box from '../Box';
import './Card.css';

const CARD_BG_BASE = dqUiTokens.colors.bg;

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
  description,
  error,
  actionVariant = 'favorite',
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
  const hasBody = Boolean(description) || Boolean(children);

  const actionElement = actionVariant === 'close'
    ? <Button icon={XIcon} ariaLabel="Close" size="sm" radius="rounded" onClick={onAction} />
    : actionVariant === 'favorite'
      ? <ToggleButton variant="favorite" icon={StarIcon} fillOnPress ariaLabel="Favorite" onPressedChange={onAction} />
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
            >
              {title}
            </Title>
          ) : null}
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
                <span key={index} className="dq-layout-card__meta-item">{part}</span>
              ))}
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
            {children}
          </Box>
        </>
      ) : null}
    </Component>
  );
};

export default Card;
