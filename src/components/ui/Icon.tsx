import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
  style?: CSSProperties;
}

export function Icon({ name, filled = false, className = '', size = 24, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
    >
      {name}
    </span>
  );
}
