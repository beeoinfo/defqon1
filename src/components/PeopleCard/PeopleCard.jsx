import Badge from '../primitives/Badge';
import Box from '../layout/Box';
import './PeopleCard.css';

const PeopleCard = ({
  component = 'article',
  avatarSrc,
  avatarAlt = '',
  name,
  handle,
  owner = false,
  ownerLabel = 'Owner',
  className = '',
  style,
  ...props
}) => {
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
        <img
          src={avatarSrc}
          alt={avatarAlt}
          className="dq-people-card__avatar"
        />
      </Box>

      <Box
        component="div"
        slot="content"
        gap="0"
        className="dq-people-card__content"
      >
        <span className="dq-people-card__name">
          {name}
        </span>
        {handle ? (
          <span className="dq-people-card__handle">{handle}</span>
        ) : null}
      </Box>

      {owner ? (
        <Badge
          size="sm"
          className="dq-people-card__owner"
        >
          {ownerLabel}
        </Badge>
      ) : null}
    </Box>
  );
};

export default PeopleCard;
