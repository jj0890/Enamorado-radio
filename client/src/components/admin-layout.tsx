import { type ReactNode, type ElementType } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {title && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </header>
      )}
      <main className="p-6">{children}</main>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Optional lucide icon component — accepted but not rendered (layout-only) */
  icon?: ElementType;
  /** Action buttons rendered on the right — takes precedence over children */
  actions?: ReactNode;
  children?: ReactNode;
}

export function SectionHeader({ title, description, actions, children }: SectionHeaderProps) {
  const right = actions ?? children;
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
