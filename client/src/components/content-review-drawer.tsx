import { type ReactNode } from "react";

interface ContentReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function ContentReviewDrawer({ open, onClose, children }: ContentReviewDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-full md:w-1/2 lg:w-1/3 bg-white shadow-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
