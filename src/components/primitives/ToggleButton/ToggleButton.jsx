import { useState } from 'react';
import Button from '../Button';
import './ToggleButton.css';

export const isToggleAccentVariant = (variant) => variant === 'favorite' || variant === 'likes';

export const resolveIconProps = ({ icon, pressed, fillOnPress = false }) => {
  if (!icon) {
    return { Icon: null, iconWeight: undefined };
  }

  return {
    Icon: icon,
    iconWeight: fillOnPress && pressed ? 'fill' : undefined,
  };
};

const ToggleButton = ({
  pressed,
  defaultPressed = false,
  onPressedChange,
  onClick,
  variant = 'ghost',
  icon = null,
  fillOnPress = false,
  className = '',
  ...props
}) => {
  const [internalPressed, setInternalPressed] = useState(() => defaultPressed);
  const isControlled = pressed !== undefined;
  const isPressed = isControlled ? pressed : internalPressed;
  const iconProps = resolveIconProps({ icon, pressed: isPressed, fillOnPress });

  const handleClick = (event) => {
    const nextPressed = !isPressed;

    if (!isControlled) {
      setInternalPressed(nextPressed);
    }

    onPressedChange?.(nextPressed, event);
    onClick?.(event);
  };

  return (
    <Button
      {...props}
      icon={iconProps.Icon}
      iconWeight={iconProps.iconWeight}
      selected={isPressed}
      aria-pressed={isPressed}
      variant={isToggleAccentVariant(variant) ? 'ghost' : variant}
      className={[
        'dq-ui-toggle-button',
        `dq-ui-toggle-button--${variant}`,
        fillOnPress ? 'dq-ui-toggle-button--fill-on-press' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
    />
  );
};

export default ToggleButton;
