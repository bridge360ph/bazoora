import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
}

export function Modal({
  title,
  children,
  onClose,
  width = 560,
}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto w-full"
        style={{ maxWidth: width }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 text-xl"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}