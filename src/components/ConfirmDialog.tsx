import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void; // optional for info-only dialogs
  hideCancelButton?: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const dialogStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 420, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, hideCancelButton = false }) => {
  if (!open) return null;
  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={dialogStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
        <p style={{ marginTop: 0, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {!hideCancelButton && (
            <button onClick={onCancel} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#f9f9f9', cursor: 'pointer' }}>{cancelText}</button>
          )}
          <button onClick={onConfirm} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#b71c1c', color: '#fff', cursor: 'pointer' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


