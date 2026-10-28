import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'green' | 'red';
  size?: 'md' | 'sm';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const variantClass =
    variant === 'outline' ? 'o' : variant === 'green' ? 'g' : variant === 'red' ? 'r' : '';
  const sizeClass = size === 'sm' ? 'sm' : '';

  const combinedClass = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button className={combinedClass} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
