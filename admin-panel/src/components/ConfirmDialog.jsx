// src/components/ConfirmDialog.jsx
import React, { useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({
  isOpen,
  title = 'Delete item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === 'Escape' && onCancel?.();
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />

      {/* center */}
      <div
        className="relative z-10 flex min-h-full items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        role="dialog" aria-modal="true" aria-labelledby="confirm-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <h3 id="confirm-title" className="ml-2 text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close confirm dialog"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
          </div>

          <div className="mt-6 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
