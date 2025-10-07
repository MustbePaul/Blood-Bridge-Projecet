import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: 40,
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>
        {icon || '🩸'}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {description && (
        <div style={{ color: '#666', marginBottom: 16 }}>{description}</div>
      )}
      {action}
    </div>
  );
};

export default EmptyState;




