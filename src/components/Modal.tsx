import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  message,
  type,
  showConfirm = false,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onClose,
}: ModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-12 h-12 text-emerald-400" />;
      case 'danger':
        return <XCircle className="w-12 h-12 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-12 h-12 text-cyan-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-xs bg-[#110724] border border-gold-primary/30 rounded-2xl p-6 text-center shadow-2xl z-10"
          >
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>

            <div 
              className="text-sm font-semibold text-slate-100 mb-6 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: message }}
            />

            <div className="flex gap-3 justify-center">
              {showConfirm ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      onClose();
                    }}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black hover:brightness-110 rounded-xl text-xs font-extrabold transition shadow-lg shadow-gold-primary/20"
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-6 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black hover:brightness-110 rounded-xl text-xs font-extrabold transition shadow-lg shadow-gold-primary/20"
                >
                  OK
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
