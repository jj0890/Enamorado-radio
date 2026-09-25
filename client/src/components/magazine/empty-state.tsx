interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

import React from "react";

export default function EmptyState({ title = "Nothing here yet", description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-ink-faint">{icon}</div>}
      <h3 className="font-display font-black uppercase text-2xl text-foreground mb-2">{title}</h3>
      {description && (
        <p className="font-serif italic text-ink-muted max-w-md" style={{ fontSize: "1rem" }}>
          {description}
        </p>
      )}
    </div>
  );
}
