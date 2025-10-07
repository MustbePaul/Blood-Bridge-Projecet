// src/components/DonorModal.tsx
import React from "react";

interface DonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DonorModal: React.FC<DonorModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default DonorModal;
