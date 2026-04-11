import { PlusIcon } from '@phosphor-icons/react';
import './PeopleStack.css';

const PeopleStack = ({
  avatars = [],
  maxVisible = 10,
  ariaLabel,
  onClick,
  className = '',
  style,
  ...props
}) => {
  const safeAvatars = Array.isArray(avatars)
    ? avatars
      .map((avatar, index) => (
        typeof avatar === 'string'
          ? {
              id: `avatar-${index}`,
              src: avatar,
            }
          : {
              id: avatar?.id ?? avatar?.userId ?? avatar?.avatarUrl ?? avatar?.src ?? `avatar-${index}`,
              src: avatar?.avatarUrl ?? avatar?.src ?? '',
            }
      ))
      .filter((avatar) => Boolean(avatar.src))
    : [];
  const resolvedMaxVisible = Math.max(Number(maxVisible) || 0, 0);
  const visibleAvatars = safeAvatars.slice(0, resolvedMaxVisible);
  const hasHiddenAvatars = safeAvatars.length > resolvedMaxVisible;
  const resolvedAriaLabel =
    ariaLabel ??
    `Open people stack for ${safeAvatars.length} person${safeAvatars.length === 1 ? '' : 's'}`;

  return (
    <button
      {...props}
      type="button"
      onClick={onClick}
      aria-label={resolvedAriaLabel}
      className={[
        'dq-ui-people-stack',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      <span className="dq-ui-people-stack__avatars" aria-hidden="true">
        {visibleAvatars.map((avatar, index) => (
          <span
            key={avatar.id ?? index}
            className="dq-ui-people-stack__avatar-shell"
            style={{ zIndex: visibleAvatars.length - index }}
          >
            <img
              src={avatar.src}
              alt=""
              className="dq-ui-people-stack__avatar"
            />
          </span>
        ))}
        {hasHiddenAvatars ? (
          <span
            className="dq-ui-people-stack__avatar-shell dq-ui-people-stack__avatar-shell--more"
            style={{ zIndex: visibleAvatars.length + 1 }}
          >
            <span className="dq-ui-people-stack__more">
              <PlusIcon size={15} aria-hidden="true" />
            </span>
          </span>
        ) : null}
      </span>
    </button>
  );
};

export default PeopleStack;
