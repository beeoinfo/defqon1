import useCachedImageUrl from '@/hooks/useCachedImageUrl';
import Badge from '../primitives/Badge';
import Box from '../layout/Box';
import './PeopleCard.css';

const PeopleCard = ({
  component = 'article',
  avatarSrc,
  avatarAlt = '',
  name,
  handle,
  meta,
  owner = false,
  ownerLabel = 'Owner',
  endSlot = null,
  className = '',
  style,
  ...props
}) => {
  const cachedAvatarSrc = useCachedImageUrl(avatarSrc);

  return (
    <Box
      {...props}
      component={component}
      background="surface"
      direction="row"
      align="center"
      gap="8px"
      className={['dq-people-card', className].filter(Boolean).join(' ')}
      style={style}
    >
      <Box
        component="span"
        slot="content"
        align="center"
        justify="center"
        className="dq-people-card__avatar-shell"
      >
        {cachedAvatarSrc ? (
          <img
            src={cachedAvatarSrc}
            alt={avatarAlt}
            className="dq-people-card__avatar"
          />
        ) : null}
      </Box>

      <Box
        component="div"
        slot="content"
        gap="0"
        className="dq-people-card__content"
      >
        <span className="dq-people-card__name-row">
          <span className="dq-people-card__name">
            {name}
          </span>
          {owner ? (
            <Badge
              size="sm"
              className="dq-people-card__owner"
            >
              {ownerLabel}
            </Badge>
          ) : null}
        </span>
        {handle ? (
          <span className="dq-people-card__handle">{handle}</span>
        ) : null}
        {meta ? (
          <span className="dq-people-card__meta">{meta}</span>
        ) : null}
      </Box>

      {endSlot ? (
        <Box component="span" slot="content" className="dq-people-card__end-slot">
          {endSlot}
        </Box>
      ) : null}
    </Box>
  );
};

export default PeopleCard;
