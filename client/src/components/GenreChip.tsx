import React from 'react';
import { Link } from 'react-router-dom';

interface GenreChipProps {
  slug: string;
  name: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export function GenreChip({
  slug,
  name,
  active = false,
  size = 'md',
  clickable = true,
  onClick
}: GenreChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  const baseClasses = `
    inline-block rounded font-bold uppercase tracking-wide
    transition-all duration-200
    ${sizeClasses[size]}
  `;

  const stateClasses = active
    ? 'bg-black text-white'
    : 'bg-gray-100 text-black hover:bg-black hover:text-white';

  if (!clickable) {
    return (
      <span className={`${baseClasses} ${stateClasses} cursor-default`}>
        {name}
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${stateClasses}`}
      >
        {name}
      </button>
    );
  }

  return (
    <Link
      to={`/browse?genre=${slug}`}
      className={`${baseClasses} ${stateClasses}`}
    >
      {name}
    </Link>
  );
}

// Genre Badge (for primary genre display)
interface GenreBadgeProps {
  name: string;
}

export function GenreBadge({ name }: GenreBadgeProps) {
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white rounded">
      {name}
    </span>
  );
}
