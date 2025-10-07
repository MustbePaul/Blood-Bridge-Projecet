import React from 'react';

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, header, footer, style }) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #eee',
      ...style
    }}>
      {header && (
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          {header}
        </div>
      )}
      <div style={{ padding: 16 }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: 12, borderTop: '1px solid #eee', background: '#fafafa' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;




