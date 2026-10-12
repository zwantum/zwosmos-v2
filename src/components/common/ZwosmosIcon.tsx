import React from 'react';

export interface ZwosmosIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official Zwosmos UI Brand Icon Component
 * Renders the delta chevron emblem from public/assets/icons/Zwosmos_Icon_UI.svg
 * Defaults to the brand purple theme.
 */
export const ZwosmosIcon: React.FC<ZwosmosIconProps> = ({
  size = 12,
  color = 'var(--brand-purple)',
  className = '',
  style = {}
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill={color}
      className={`zwosmos-icon-ui ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.1em',
        flexShrink: 0,
        ...style
      }}
      aria-hidden="true"
    >
      <polygon points="334.39 282.35 255.87 40.9 177.5 282.37 7.66 471.1 255.98 418.24 504.34 470.97 334.39 282.35" />
    </svg>
  );
};

export default ZwosmosIcon;
