import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, description, actions }) => {
  const displayText = subtitle || description;
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginBottom: 24 
    }}>
      <div>
        <h1 style={{ color: 'var(--color-primary)', margin: 0 }}>{title}</h1>
        {displayText && (
          <div style={{ color: 'var(--color-muted)', marginTop: 6 }}>{displayText}</div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 12 }}>{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;




