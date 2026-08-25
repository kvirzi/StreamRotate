import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.width = '';
      // Reset any horizontal scroll iOS WebKit may have introduced
      window.scrollTo(0, window.scrollY);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.width = '';
      window.scrollTo(0, window.scrollY);
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto overflow-x-hidden"
      style={{ padding: '16px' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative ${widths[size]} bg-bg-card border border-bg-border rounded-2xl shadow-2xl fade-in my-4 sm:my-0`}
        style={{ width: 'calc(100vw - 32px)', maxWidth: widths[size] === 'max-w-sm' ? '384px' : widths[size] === 'max-w-md' ? '448px' : '672px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-bg-border bg-bg-card rounded-t-2xl">
          <h2 className="font-display font-semibold text-lg text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[65vh]">{children}</div>
      </div>
    </div>,
    document.body
  );
}
