/**
 * Keyboard-aware scroll utility for mobile PWA
 * Handles iOS Safari keyboard overlay issues
 */

const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Handle input focus to scroll element into view when keyboard appears
 * Works around iOS Safari keyboard overlay issues
 */
export const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
  const target = event.target;

  if (isIOS()) {
    // iOS Safari has delayed keyboard animation - wait for it
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  } else {
    // Android handles keyboard faster
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }
};

/**
 * Enhanced keyboard handler using visualViewport API
 * Returns cleanup function for useEffect
 */
export const setupKeyboardHandler = (
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
): (() => void) | undefined => {
  const viewport = window.visualViewport;
  if (!viewport || !inputRef.current) return undefined;

  const handleResize = () => {
    if (document.activeElement === inputRef.current) {
      // Keyboard height changed - scroll input into view
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  viewport.addEventListener('resize', handleResize);

  return () => {
    viewport.removeEventListener('resize', handleResize);
  };
};

/**
 * Props to spread on input elements for keyboard-aware behavior
 */
export const keyboardAwareProps = {
  onFocus: handleInputFocus,
};
