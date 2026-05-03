import { type ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function SectionHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {description && (
        <p className="text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
