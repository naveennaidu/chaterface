import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
}

export default function Button({ href, children, className = '', icon, iconPosition = 'left', size = 'medium' }: ButtonProps) {
  const sizeClasses = {
    small: 'px-4 py-2 text-xs rounded-md',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all hover:scale-105',
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className={cn(iconPosition === 'left' ? 'mr-2 order-first' : 'ml-2 order-last')}>{icon}</span>}
      {children}
    </Link>
  );
} 