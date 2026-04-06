import { useState } from 'react';
import { Star } from 'lucide-react';
import Button from '../Button/index';
import './ToggleButton.css';

function getFilledIcon(Icon) {
  return function FilledIcon(props) {
    return <Icon {...props} fill="currentColor" />;
  };
}

export function resolveToggleIcons({ variant, icon, selectedIcon, pressed }) {
  if (variant !== 'favorite') {
    return {
      icon: icon ?? null,
      selectedIcon: selectedIcon ?? null,
      currentIcon: pressed ? selectedIcon ?? icon ?? null : icon ?? null,
    };
  }

  const resolvedIcon = icon ?? Star;

  return {
    icon: resolvedIcon,
    selectedIcon: selectedIcon ?? getFilledIcon(resolvedIcon),
    currentIcon: pressed ? selectedIcon ?? getFilledIcon(resolvedIcon) : resolvedIcon,
  };
}

export default function ToggleButton({
  pressed,
  defaultPressed = false,
  onPressedChange,
  onClick,
  variant = 'ghost',
  icon = null,
  selectedIcon = null,
  className = '',
  ...props
}) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isControlled = pressed !== undefined;
  const isPressed = isControlled ? pressed : internalPressed;
  const resolvedIcons = resolveToggleIcons({
    variant,
    icon,
    selectedIcon,
    pressed: isPressed,
  });

  function handleClick(event) {
    const nextPressed = !isPressed;

    if (!isControlled) {
      setInternalPressed(nextPressed);
    }

    onPressedChange?.(nextPressed, event);
    onClick?.(event);
  }

  return (
    <Button
      {...props}
      icon={resolvedIcons.currentIcon ?? resolvedIcons.icon}
      selected={isPressed}
      aria-pressed={isPressed}
      variant={variant === 'favorite' ? 'ghost' : variant}
      className={['dq-ui-toggle-button', `dq-ui-toggle-button--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
    />
  );
}
