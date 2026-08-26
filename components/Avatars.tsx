import React, { useState } from 'react';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 28, md: 32, lg: 36 };

/** Black circle with P — The Precinct mark */
export const PrecinctAvatar: React.FC<{ size?: Size; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const px = SIZE_PX[size];
  return (
    <div
      className={`shrink-0 rounded-full bg-ink-950 text-white flex items-center justify-center font-sans font-semibold ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: px * 0.42,
        letterSpacing: '-0.02em',
      }}
      aria-hidden
    >
      P
    </div>
  );
};

/** User photo from Google, with initial fallback */
export const UserAvatar: React.FC<{
  name: string;
  picture?: string | null;
  size?: Size;
  className?: string;
}> = ({ name, picture, size = 'md', className = '' }) => {
  const [broken, setBroken] = useState(false);
  const px = SIZE_PX[size];
  const initial = (name?.trim()?.[0] || '?').toUpperCase();

  if (picture && !broken) {
    return (
      <img
        src={picture}
        alt=""
        width={px}
        height={px}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full bg-ink-200 text-ink-800 flex items-center justify-center font-sans font-medium ${className}`}
      style={{ width: px, height: px, fontSize: px * 0.38 }}
      aria-hidden
    >
      {initial}
    </div>
  );
};
