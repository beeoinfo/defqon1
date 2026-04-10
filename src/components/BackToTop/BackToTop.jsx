import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from '@phosphor-icons/react';
import Button from '../primitives/Button';
import './BackToTop.css';

const scrollToTopQuickly = () => {
  const startY = window.scrollY || window.pageYOffset || 0;

  if (startY <= 0) {
    return;
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const BackToTop = ({
  ariaLabel = 'Back to top',
  title = 'Back to top',
  showAfter = 240,
  className = '',
  onClick,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const syncVisibility = () => {
      frameRef.current = 0;

      const nextVisible = window.scrollY > showAfter;

      isVisibleRef.current = nextVisible;
      setIsVisible((currentVisible) => (
        currentVisible === nextVisible ? currentVisible : nextVisible
      ));
    };

    const handleScroll = () => {
      const nextVisible = window.scrollY > showAfter;

      if (nextVisible === isVisibleRef.current || frameRef.current) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(syncVisibility);
    };

    syncVisibility();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameRef.current);
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
        'dq-back-to-top',
        isVisible ? 'dq-back-to-top--visible' : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
    />
  );
};

export default BackToTop;
