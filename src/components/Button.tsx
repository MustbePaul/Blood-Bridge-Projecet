import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const stylesByVariant: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: '#fff' },
  secondary: { background: 'var(--color-secondary)', color: '#fff' },
  success: { background: 'var(--color-success)', color: '#fff' },
  danger: { background: 'var(--color-danger)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--color-text)', border: '1px solid #ddd' },
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', iconLeft, iconRight, style, children, ...props }) => {
  return (
    <button
      {...props}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...stylesByVariant[variant],
        ...style,
      }}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
};

export default Button;




