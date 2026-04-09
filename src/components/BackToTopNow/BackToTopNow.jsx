import { useEffect, useState } from 'react';
import { ArrowUpIcon } from '@phosphor-icons/react';
import Button from '../primitives/Button';
import './BackToTopNow.css';

const scrollToTopQuickly = () => {
  const startY = window.scrollY || window.pageYOffset || 0;

  if (startY <= 0) {
    return;
  }

  const duration = 220;
  const startTime = performance.now();
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  const tick = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);

    window.scrollTo(0, Math.round(startY * (1 - easedProgress)));

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
};

const BackToTopNow = ({
  ariaLabel = 'Back to top',
  title = 'Back to top',
  showAfter = 240,
  className = '',
  onClick,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAfter]);

  const handleClick = (event) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    scrollToTopQuickly();
    event.currentTarget.blur();
  };

  return (
    <Button
      {...props}
      icon={ArrowUpIcon}
      ariaLabel={ariaLabel}
      title={title}
      size="lg"
      radius="md"
      className={[
        'dq-back-to-top-now',
        isVisible ? 'dq-back-to-top-now--visible' : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
    />
  );
};

export default BackToTopNow;
